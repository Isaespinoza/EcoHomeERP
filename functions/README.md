# Sincronización con Meta Ads

Trae el gasto de las campañas desde Meta y lo escribe en la colección `campanas` de
Firestore. El ERP la lee como cualquier otra colección y no habla nunca con Meta.

## Antes de desplegar

1. **Firebase en plan Blaze.** El plan gratis bloquea las llamadas salientes a servicios
   que no son de Google, así que la función no podría llegar a Meta.
2. **Token de Meta.** En Business Manager → Configuración → Usuarios del sistema: crear
   uno, asignarle la cuenta publicitaria y generar un token con permiso `ads_read`. Los
   tokens de Usuario del Sistema no vencen solos.
3. **Reglas de Firestore.** Si listan colecciones por nombre, agregar `campanas` o los
   guardados fallan sin avisar.

## Desplegar

```bash
cd functions && npm install

firebase functions:secrets:set META_TOKEN        # pega el token
firebase functions:secrets:set META_AD_ACCOUNT   # el id de la cuenta, con o sin act_

firebase deploy --only functions
```

## Traer las campañas pasadas

Una sola vez, con la URL que imprime el deploy:

```bash
curl "https://<url>/rellenarMetaAds?desde=2025-01-01"
```

Las campañas viejas entran con gasto, leads e impresiones, pero **sin ventas atribuidas**:
en esa época no existían los cupones y no hay forma de saber qué vendió cada anuncio. El
ERP las muestra en gris como "Sin atribución" y su gasto queda fuera de los totales.

## Después

Corre sola todas las mañanas a las 7 (hora de Santiago) y refresca los últimos 30 días,
no solo el anterior: Meta reasigna conversiones días después de que ocurren.

Los cupones amarran cada venta a su campaña. La sincronización busca la campaña por
`metaId` y después por nombre exacto, y actualiza el documento que ya existe conservando
su id — si creara uno nuevo, los cupones quedarían apuntando a una campaña huérfana.
