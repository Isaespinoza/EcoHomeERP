# Handoff: EcoHome ERP — Rediseño de interfaz (grafito + salvia, bento glass)

## Overview
Rediseño completo de la interfaz del ERP EcoHome (venta/gestión de muebles y colchones). Reemplaza la UI actual (ver https://isaespinoza.github.io/EcoHomeERP/) por un lenguaje visual oscuro, tipo "bento grid" con vidrio esmerilado (glassmorphism), sidebar fija, y un acento verde salvia sobre fondo grafito casi negro.

## About the Design Files
Los archivos de este bundle son **referencias de diseño hechas en HTML** (mockups estáticos, sin lógica real) — no son código de producción para copiar tal cual. La tarea es **recrear estos diseños HTML en el entorno real del ERP** (el stack que ya usa EcoHomeERP — revisar el repo actual para confirmar framework/stack) manteniendo toda la lógica de negocio existente (ventas, stock, saldos, etc.) intacta. Solo se reemplaza la capa visual/UI.

## Fidelity
**Alta fidelidad (hifi)**: colores, tipografía, espaciados y jerarquía están definidos y deben respetarse tal cual. Los datos que se ven en las pantallas (nombres de clientes, montos) son de ejemplo — deben conectarse a los datos reales del sistema.

## Design Tokens

**Colores**
- Fondo base: `#151513` (grafito casi negro)
- Superficie "vidrio": `rgba(255,255,255,.05)` con `backdrop-filter: blur(20-28px)` y borde `rgba(255,255,255,.1)`
- Texto primario: `#f4f7ff` · Texto secundario: `rgba(244,247,255,.5-.62)` · Texto terciario/placeholder: `rgba(244,247,255,.35)`
- Acento (marca): salvia — gradiente `#8fbfa2 → #3f6e56`; texto de acento `#c3e2d2`; fondo de acento `rgba(122,168,140,.15-.32)`
- Estados de venta: Pendiente `#f4d778` · Pagado `#f2c14b` · Despachado `#8bf0b0` · Cancelado `#f28a8a` (cada uno con fondo `rgba(…, .14-.18)` y un punto de color de 6px como indicador, sin emojis)
- Glow decorativo de fondo: blobs radiales grandes (400-800px) en blanco tenue y salvia, `filter: blur(12-14px)`, opacidad baja — puramente decorativo, no bloquea contenido

**Tipografía**
- Encabezados y cifras: **Space Grotesk** (600), tracking `-0.01em` a `-0.02em`. H1 21px, títulos de tarjeta 15px, cifras hero 30-40px
- Cuerpo/tablas/labels: **Inter** 400-600, 12.5-13.5px
- Labels en mayúscula: Inter 700, 10.5px, tracking `.05em`

**Espaciado / radios**
- Radio de tarjetas: 16-22px · Radio de botones/inputs: 9-12px · Radio de badges: pill (20px)
- Padding estándar de tarjeta: 16-26px · Gap entre tarjetas del bento grid: 14px

**Iconografía**
- Sin emojis. Set de íconos geométricos custom (16-18px) construidos con CSS puro (bordes, líneas, círculos) para: Inicio, Ventas, Cotizaciones, Despachos, Caja, Inventario, Clientes, Vendedores, Finanzas. Ver sección "Sistema de componentes" en el archivo de diseño.

## Screens / Views

### 1. Inicio (Dashboard) — desktop
Sidebar fija (250px) con logo, navegación agrupada (Principal / Gestión) y perfil de usuario abajo. Top bar con buscador y botón "Nueva venta". Bento grid: tarjeta hero "Ventas hoy" (con mini gráfico de barras) a la izquierda ocupando 2 filas; KPIs "Saldos pendientes" y "Despachos hoy" arriba a la derecha; tabla "Ventas recientes" (cliente, fecha, vendedor, monto, estado) ocupando el resto.

### 2. Ventas — listado
Misma sidebar/top bar. Barra de filtros: chips Todos/Minorista/Mayorista, rango de fechas, vendedor, forma de pago, chips de estado. Tabla de 8 columnas: Cliente, Teléfono, Fecha, Vendedor, Forma de pago, Monto, Saldo, Estado.

### 3. Nueva Venta — página completa
Layout de 2 columnas. Izquierda: Datos de la venta (fecha/tipo/vendedor), Cliente (nombre/teléfono/forma de pago), Despacho (costo/dirección/hora), Productos (tabla editable). Derecha: tarjeta de Total venta (con desglose subtotal/despacho/cancelado), tarjeta de Saldo pendiente, Notas. Top bar con acciones Cancelar/Guardar venta.

### 4. Sistema de componentes (referencia)
Página única con: paleta de color, escala tipográfica, set de íconos, variantes de botón (primario/secundario/ghost/destructivo/deshabilitado), badges de estado, campos de formulario (vacío/valor/foco/segmentado), estados de navegación (activo/hover/default), variantes de tarjeta.

### 5. Vistas móviles (5a Inicio, 5b Ventas, 5c Nueva Venta)
Mismo lenguaje visual en un frame de iPhone. Sin sidebar: header simple + contenido en una columna, tarjetas apiladas en vez de tabla (Ventas), tab bar flotante inferior con 5 accesos (Inicio, Ventas, Nueva venta como botón circular central, Despachos, Caja). Nueva Venta móvil usa formulario apilado con botón "Guardar venta" fijo abajo.

## Interactions & Behavior
- Sidebar: ítem activo con fondo/borde salvia + glow; hover con fondo blanco 4%.
- Botones primarios: gradiente salvia + sombra de color a juego; estado deshabilitado con opacidad/fondo neutro.
- Inputs: estado foco con borde salvia sólido + halo `box-shadow: 0 0 0 3px rgba(122,168,140,.18)`.
- Responsive: en móvil el sidebar desaparece y se reemplaza por tab bar inferior; las tablas densas se convierten en listas de tarjetas.

## Files
- `EcoHome ERP - Design System.html` — todas las pantallas y el sistema de componentes (abrir en navegador; usar zoom/scroll para navegar entre opciones marcadas 1a, 2a, 3a, 4a, 5a, etc.)

## Assets
No se usan imágenes ni iconos externos — toda la iconografía es CSS puro, sin dependencias.
