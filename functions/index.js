// Sincroniza el gasto de Meta Ads hacia la colección `campanas` de Firestore.
//
// Por qué existe: el ERP es un index.html público en GitHub Pages, así que el token de
// Meta no puede vivir ahí — cualquiera que abra el código fuente podría gastar el
// presupuesto de anuncios. El token queda en Secret Manager y solo esta función lo ve.
// El ERP no habla nunca con Meta: lee `campanas` como lee cualquier otra colección.
//
// Corre sola cada mañana. También se puede disparar a mano para rellenar historia.

const {onSchedule} = require('firebase-functions/v2/scheduler');
const {onRequest} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const META_TOKEN = defineSecret('META_TOKEN');
const META_AD_ACCOUNT = defineSecret('META_AD_ACCOUNT');

// Meta descontinúa versiones viejas del Graph API cada ~2 años. Si la función empieza a
// devolver error de versión, subir este número y revisar el changelog de Meta.
const API_VERSION = 'v21.0';

// Cuántos días hacia atrás refrescar en cada corrida. Meta reasigna conversiones días
// después de que ocurren, así que refrescar solo "ayer" deja números viejos congelados.
const DIAS_REFRESCO = 30;

// El embudo de EcoHome termina en WhatsApp, no en un carrito: el "lead" que importa es la
// conversación iniciada. Se toma el primero que exista, en este orden.
const ACCIONES_LEAD = [
  'onsite_conversion.messaging_conversation_started_7d',
  'onsite_conversion.total_messaging_connection',
  'lead',
  'link_click'
];

function isoDia(d) {
  return d.toISOString().slice(0, 10);
}

function contarLeads(actions) {
  if (!Array.isArray(actions)) return 0;
  for (const tipo of ACCIONES_LEAD) {
    const a = actions.find(x => x.action_type === tipo);
    if (a) return parseInt(a.value, 10) || 0;
  }
  return 0;
}

// Trae una página tras otra hasta agotar el paginado de Meta.
async function pedirInsights(token, cuenta, desde, hasta) {
  const cuentaId = String(cuenta).startsWith('act_') ? cuenta : 'act_' + cuenta;
  const params = new URLSearchParams({
    level: 'campaign',
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions',
    time_range: JSON.stringify({since: desde, until: hasta}),
    time_increment: 'all_days',
    limit: '200',
    access_token: token
  });

  let url = `https://graph.facebook.com/${API_VERSION}/${cuentaId}/insights?${params}`;
  const filas = [];

  while (url) {
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) {
      // El mensaje de Meta es el único que dice si el token venció, si falta el permiso
      // ads_read o si la cuenta está mal: no sirve de nada envolverlo en algo genérico.
      throw new Error(`Meta respondió ${res.status}: ${json.error.message}`);
    }
    filas.push(...(json.data || []));
    url = json.paging && json.paging.next ? json.paging.next : null;
  }
  return filas;
}

// Los cupones apuntan a la campaña por su id de documento. Si al sincronizar creáramos un
// documento nuevo para una campaña que ya se había cargado a mano, esos cupones quedarían
// huérfanos y la campaña perdería sus ventas. Por eso se busca primero por metaId y
// después por nombre exacto, y se actualiza el documento existente conservando su id.
async function documentoDeCampana(metaId, nombre) {
  const porMeta = await db.collection('campanas').where('metaId', '==', metaId).limit(1).get();
  if (!porMeta.empty) return porMeta.docs[0].ref;

  const porNombre = await db.collection('campanas').where('nombre', '==', nombre).limit(1).get();
  if (!porNombre.empty) return porNombre.docs[0].ref;

  return db.collection('campanas').doc('meta_' + metaId);
}

async function sincronizar(token, cuenta, desde, hasta) {
  const filas = await pedirInsights(token, cuenta, desde, hasta);
  const lote = db.batch();

  for (const f of filas) {
    const ref = await documentoDeCampana(f.campaign_id, f.campaign_name);
    // Solo se pisan los campos que manda Meta. El id del documento y cualquier cosa que
    // haya puesto el usuario se conservan con merge.
    lote.set(ref, {
      id: ref.id,
      metaId: f.campaign_id,
      nombre: f.campaign_name,
      plataforma: 'meta',
      gasto: Math.round(parseFloat(f.spend) || 0),
      leads: contarLeads(f.actions),
      impresiones: parseInt(f.impressions, 10) || 0,
      clics: parseInt(f.clicks, 10) || 0,
      desde,
      hasta,
      sincronizado: new Date().toISOString()
    }, {merge: true});
  }

  await lote.commit();
  return filas.length;
}

function ventana(dias) {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - dias * 864e5);
  return {desde: isoDia(desde), hasta: isoDia(hasta)};
}

// --- Corrida diaria ---
exports.sincronizarMetaAds = onSchedule(
  {
    schedule: '0 7 * * *',
    timeZone: 'America/Santiago',
    secrets: [META_TOKEN, META_AD_ACCOUNT],
    region: 'southamerica-west1'
  },
  async () => {
    const {desde, hasta} = ventana(DIAS_REFRESCO);
    const n = await sincronizar(META_TOKEN.value(), META_AD_ACCOUNT.value(), desde, hasta);
    console.log(`Sincronizadas ${n} campañas entre ${desde} y ${hasta}`);
  }
);

// --- Relleno de historia, a mano ---
// Se llama una vez para traer las campañas pasadas:
//   curl "https://<url>/rellenarMetaAds?desde=2025-01-01&hasta=2026-08-26"
// Ojo: las campañas viejas entran con gasto y leads pero sin ventas atribuidas, porque en
// esa época no existían los cupones. El ERP las muestra como "Sin atribución".
exports.rellenarMetaAds = onRequest(
  {secrets: [META_TOKEN, META_AD_ACCOUNT], region: 'southamerica-west1'},
  async (req, res) => {
    try {
      const desde = req.query.desde;
      const hasta = req.query.hasta || isoDia(new Date());
      if (!/^\d{4}-\d{2}-\d{2}$/.test(desde || '')) {
        res.status(400).send('Falta ?desde=AAAA-MM-DD');
        return;
      }
      const n = await sincronizar(META_TOKEN.value(), META_AD_ACCOUNT.value(), desde, hasta);
      res.send(`Listo: ${n} campañas entre ${desde} y ${hasta}.`);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error: ' + e.message);
    }
  }
);
