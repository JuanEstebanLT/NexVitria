# NexVitria Frontend

## Descripción

Frontend web de NexVitria. El proyecto contiene la base técnica del sistema visual, componentes de interfaz reutilizables y la Home visual de la marca.

## Stack tecnológico

- React
- React Router DOM
- Vite
- JavaScript
- ESLint
- CSS nativo con Custom Properties

## Requisitos

- Node.js `^20.19.0` o `>=22.12.0`
- npm

## Instalación

```bash
npm install
```

No es necesario instalar frameworks CSS ni dependencias visuales adicionales.

## Ejecución

Iniciar el entorno local:

```bash
npm run dev
```

Validar el código:

```bash
npm run lint
```

Generar el build de producción:

```bash
npm run build
```

## Estructura actual

```text
src/
├── assets/
│   ├── brand/              # Ubicación canónica de los recursos oficiales
│   └── images/
│       ├── products/       # Imágenes locales de los 17 productos
│       └── promotional/    # Panel editorial de NexVitria
├── components/
│   ├── account/
│   │   ├── UserAvatar.jsx  # Avatar reutilizable con fallback e indicador de presencia
│   │   ├── UserMenu.jsx    # Menú autenticado, presencia y acciones de cuenta
│   │   └── account.css     # Estilos de cuenta, avatar, menú y presencia
│   ├── home/
│   │   ├── Hero.jsx
│   │   ├── HeroCarousel.jsx
│   │   ├── Benefits.jsx
│   │   ├── CategoriesPreview.jsx
│   │   ├── FeaturedProducts.jsx
│   │   ├── TrustSection.jsx
│   │   ├── FinalCta.jsx
│   │   ├── HomeIcon.jsx
│   │   └── home.css
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── ScrollToTop.jsx
│   │   └── layout.css
│   ├── auth/
│   │   └── auth.css
│   ├── cart/
│   │   └── cart.css
│   ├── products/
│   │   ├── ProductCard.jsx
│   │   └── products.css
│   └── ui/
│       ├── Button.jsx      # Botón reutilizable y sus variantes visuales
│       ├── CartIcon.jsx    # Icono SVG del carrito
│       ├── Input.jsx       # Campo accesible con ayuda y error
│       └── ui.css          # Estilos compartidos de los componentes UI
├── config/
│   └── api.js              # URL central del backend
├── context/
│   ├── authContext.js      # Hook y contrato compartido de autenticación
│   ├── AuthContext.jsx     # Estado global de sesión validada
│   ├── cartContext.js      # Hook y contrato compartido del carrito
│   ├── CartContext.jsx     # Carrito local exclusivo para CLIENTE
│   ├── presenceContext.js  # Contrato, estados y hook de presencia
│   └── PresenceContext.jsx # Presencia local, inactividad y persistencia manual
├── services/
│   ├── apiClient.js        # Cliente fetch y errores consistentes
│   └── authService.js      # Contrato frontend de autenticación
├── hooks/
│   └── useActiveSection.js # Detección reutilizable de la sección visible
├── data/
│   └── products.js         # Fuente mock compartida del catálogo
├── pages/
│   ├── HomePage.jsx
│   ├── ProductsPage.jsx
│   ├── ProductDetailPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── CartPage.jsx
│   └── AccountPage.jsx
├── App.css                 # Fondos y convenciones compartidas de página
├── App.jsx                 # Router y layout compartido
├── index.css               # Tokens, reset y estilos globales
└── main.jsx                # Punto de entrada de React
```

## Sistema de diseño

Los tokens globales se definen en `src/index.css`. Los componentes deben consumir estas variables semánticas en lugar de repetir valores de color, espaciado, radios o sombras.

### Colores

| Token | Hex | Uso |
| --- | --- | --- |
| `--color-primary` | `#071B3B` | Estructura principal, fondos de marca y acciones primarias |
| `--color-primary-hover` | `#07254E` | Estado hover de elementos primarios |
| `--color-primary-interactive` | `#123E6A` | Enlaces, bordes activos y elementos interactivos |
| `--color-primary-soft` | `#E4EBF3` | Énfasis azul de baja intensidad |
| `--color-accent` | `#D49866` | Llamadas a la acción destacadas y detalles de marca |
| `--color-accent-hover` | `#C1814F` | Estado hover del acento |
| `--color-accent-light` | `#E5B184` | Detalles e indicadores sobre fondos oscuros |
| `--color-accent-soft` | `#F8ECE2` | Fondo de acento de baja intensidad |
| `--color-background` | `#F5F7FA` | Fondo general de la aplicación |
| `--color-surface` | `#FFFFFF` | Tarjetas, controles y superficies elevadas |
| `--color-surface-secondary` | `#EEF3F8` | Superficies secundarias y estados deshabilitados |
| `--color-text` | `#0D1932` | Texto principal |
| `--color-text-secondary` | `#5F6B7A` | Texto de apoyo y metadatos |
| `--color-border` | `#D9E1E8` | Bordes y divisores |
| `--color-focus` | `#123E6A` | Indicador visible de foco |
| `--color-error` | `#B42318` | Mensajes y bordes de error accesibles |

El azul es el color estructural dominante. El cobre se reserva para acciones destacadas, selección, iconografía relevante y pequeños detalles; no debe convertirse en el color dominante de una pantalla.

### Tipografía

La tipografía principal es **Manrope**, cargada desde Google Fonts mediante `preconnect` y una hoja de estilos declarada en `index.html`. No requiere paquetes npm. La pila de respaldo es:

```css
"Manrope", Aptos, "Segoe UI", sans-serif
```

Se cargan los pesos `400`, `500`, `600`, `700` y `800`:

- `800`: título principal del Hero.
- `700`: títulos de sección y tarjetas.
- `600`: navegación, botones, etiquetas y énfasis.
- `400` y `500`: párrafos, ayudas y contenido general.

Los tamaños disponibles son:

- `--font-size-sm`: `0.875rem`, para ayudas, labels y texto pequeño.
- `--font-size-base`: `1rem`, para texto general.
- `--font-size-subtitle`: `1.125rem`, para subtítulos.
- `--font-size-title`: escala fluida entre `1.75rem` y `2.75rem`, para títulos principales.

La jerarquía evita utilizar `800` fuera de los títulos principales y conserva pesos moderados para favorecer la lectura.

### Espaciado

La escala parte de unidades de `0.25rem`:

| Token | Valor |
| --- | --- |
| `--spacing-1` | `0.25rem` |
| `--spacing-2` | `0.5rem` |
| `--spacing-3` | `0.75rem` |
| `--spacing-4` | `1rem` |
| `--spacing-6` | `1.5rem` |
| `--spacing-8` | `2rem` |
| `--spacing-12` | `3rem` |

### Border radius

| Token | Valor | Uso sugerido |
| --- | --- | --- |
| `--radius-sm` | `0.375rem` | Indicadores y elementos compactos |
| `--radius-md` | `0.625rem` | Botones y campos |
| `--radius-lg` | `1rem` | Tarjetas y superficies amplias |

### Sombras

| Token | Valor | Uso sugerido |
| --- | --- | --- |
| `--shadow-sm` | `0 1px 2px rgb(7 27 59 / 6%)` | Separación sutil de controles y tarjetas |
| `--shadow-md` | `0 10px 30px rgb(7 27 59 / 8%)` | Énfasis moderado en superficies relevantes |

Las sombras deben conservar baja opacidad. No se utilizan para sustituir bordes o jerarquía de contenido.

### Responsive / breakpoints

La convención es mobile-first:

| Contexto | Rango aproximado |
| --- | --- |
| Mobile | Menos de `48rem` / 768 px |
| Tablet | Desde `48rem` / 768 px |
| Desktop | Desde `64rem` / 1024 px |
| Wide desktop | Desde `80rem` / 1280 px |

Los componentes deben funcionar primero en pantallas pequeñas y agregar complejidad de layout únicamente cuando el contenido lo requiera.

### Accesibilidad

- Todo elemento interactivo conserva un `:focus-visible` con contorno de alto contraste.
- Los controles mantienen un objetivo táctil mínimo aproximado de 44 px.
- Los `Input` relacionan programáticamente label, ayuda y error mediante `htmlFor`, `id` y `aria-describedby`.
- Los errores combinan texto, símbolo y color; nunca dependen exclusivamente del color.
- `prefers-reduced-motion: reduce` minimiza transiciones y animaciones globales.
- Se priorizan HTML semántico, contraste legible y navegación por teclado.

### Organización de assets

Los recursos oficiales de marca pertenecen exclusivamente a:

```text
src/assets/brand/
├── nexvitria-symbol.png
└── nexvitria-logo.png
```

- `nexvitria-logo.png`: logotipo horizontal y oficial de NexVitria.
- `nexvitria-symbol.png`: símbolo gráfico oficial para espacios compactos, Hero, Footer y favicon.

Los recursos originales de marca no deben modificarse directamente, recolorearse, comprimirse ni sustituirse desde los componentes. Los futuros assets deben agruparse por propósito dentro de `src/assets/`, sin mezclar recursos de producto con la identidad de marca.

La pestaña del navegador utiliza `nexvitria-symbol.png` como favicon y el título `NexVitria | Productos naturales y cuidado personal`. Vite procesa el archivo desde su ruta fuente durante el build.

## Convenciones

- Los componentes visuales genéricos viven en `src/components/ui/`.
- Los componentes de dominio se crearán posteriormente en carpetas propias y compondrán los elementos UI existentes.
- Los estilos globales y tokens pertenecen a `src/index.css`.
- Cada grupo pequeño de componentes puede compartir un CSS local cuando tengan el mismo propósito.
- Los componentes deben aceptar `className`, usar propiedades semánticas y evitar lógica de negocio.
- No se deben duplicar colores o medidas si ya existe un token apropiado.
- Las nuevas páginas se organizan en `src/pages/` y se registran en `App.jsx`.

## Home

La Home visual está organizada en componentes independientes para Hero, beneficios, soluciones, productos destacados, confianza y CTA final. `HomePage.jsx` compone estas secciones; `App.jsx` queda centrado en las rutas y el layout compartido.

NexVitria es una única empresa que comercializa su propio catálogo de productos naturales, cuidado personal, bienestar, cuidado capilar, cuidado corporal e higiene personal. No es SaaS, marketplace multiempresa ni software para que terceros gestionen negocios.

Los productos destacados ya no se duplican dentro de `FeaturedProducts.jsx`: se seleccionan con `featured: true` desde `src/data/products.js`. Los datos y todos los precios mostrados siguen siendo mocks locales y no están conectados al backend.

Las categorías visuales actuales son cuidado capilar, cuidado corporal, bienestar e higiene personal. Todavía no se consultan desde backend.

Las decisiones visuales principales de la Home son:

- Fondo claro con gradientes radiales suaves en cobre y azul, sobre una transición vertical hacia la superficie secundaria.
- Hero editorial que comunica directamente productos naturales y cuidado personal.
- Carrusel editorial creado con React y CSS que presenta directamente imágenes oficiales de demostración del catálogo.
- Azul navy como estructura dominante en categorías, declaración de marca, CTA y Footer.
- Cobre reservado para énfasis, indicadores y acciones prioritarias.
- Recursos oficiales de marca en Header, Hero, sección de confianza y Footer.
- Tarjetas ecommerce con las fotografías completas de cada producto, sin ilustraciones sustitutas ni recortes agresivos.
- Navegación corporativa con underline animado, estado activo dinámico y menú adaptable para móvil.
- Grids mobile-first que se adaptan a móvil, tablet, escritorio y escritorio ancho.
- Navegación móvil con apertura por opacidad y desplazamiento suave, controlada únicamente con estado local de React.
- Entrada breve del Hero y microinteracciones consistentes en botones, tarjetas, iconos y productos.
- `prefers-reduced-motion: reduce` elimina animaciones, desplazamientos y transiciones no esenciales.

Las secciones actuales son: Header/Navbar, Hero, beneficios, categorías, productos destacados, “Por qué NexVitria”, CTA final y Footer. La Home mantiene un tono comercial dirigido directamente a los clientes de NexVitria.

### Header y Footer

En escritorio, el Header agrupa la navegación principal y las acciones de acceso dentro de un mismo sistema visual. Los enlaces conservan un espaciado cómodo, mientras que `Iniciar sesión` y `Crear cuenta` mantienen una separación moderada respecto de `Nuestra marca`. En tablet y móvil continúa utilizándose el menú desplegable accesible existente.

La navegación activa combina dos fuentes sin contradecirlas: React Router marca `Inicio` en `/` y `Productos` en cualquier ruta que comience por `/productos`; `useActiveSection` e `IntersectionObserver` se habilitan únicamente en la Home para marcar las secciones internas `Categorías` y `Nuestra marca`. Los enlaces con hash usan rutas como `/#categorias` y respetan `prefers-reduced-motion`.

El Footer se organiza en cuatro bloques:

1. Identidad y descripción de NexVitria.
2. Navegación mediante enlaces de React Router hacia Home, catálogo y secciones válidas.
3. Atención al cliente.
4. Contacto y futura presencia en redes sociales.

Las opciones de atención al cliente y los textos legales se muestran como información no interactiva mientras sus páginas permanezcan pendientes. No se han creado rutas falsas. Los datos reales de contacto todavía no están definidos, por lo que el Footer comunica que los canales oficiales estarán disponibles próximamente sin inventar teléfonos, correos o direcciones.

La estructura para redes sociales e iconos SVG está preparada en `Footer.jsx`, pero no se renderiza hasta que existan URLs oficiales. El Footer utiliza una columna en móvil, dos en tablet y cuatro en escritorio, además de una franja legal inferior independiente.

### Carrusel del Hero

`HeroCarousel.jsx` contiene cuatro slides construidos con productos reales del catálogo de demostración: Shampoo Natural (`01`), Aceite Corporal Hidratante (`03`), Crema Hidratante Corporal (`04`) y Gel Limpiador Facial (`07`). Las imágenes se obtienen desde la misma fuente de datos que utiliza `/productos`, se muestran completas mediante `object-fit: contain` y no se sustituyen por envases dibujados con CSS.

El carrusel avanza automáticamente cada 6 segundos. El temporizador se pausa al mantener el puntero sobre el componente, cuando alguno de sus controles recibe foco o cuando el usuario activa la pausa manual. Incluye botones anterior/siguiente, indicadores seleccionables, control de pausa y navegación con las flechas izquierda/derecha. Cada interacción reinicia el ciclo de forma predecible.

Cuando el sistema indica `prefers-reduced-motion: reduce`, el autoplay queda desactivado y las transiciones se reducen a cambios directos sin desplazamientos. Los controles conservan `aria-label`, estados mediante `aria-pressed`, foco visible y objetivos táctiles de 44 px.

## Recursos visuales externos

No se incorporaron recursos visuales externos en esta iteración. El carrusel y las tarjetas utilizan únicamente los PNG oficiales de demostración guardados en `src/assets/images/products/`, además de los recursos propios de marca; por tanto, no existen nuevas fuentes, autores, URLs ni licencias de terceros que registrar.

## Rutas y catálogo

React Router DOM gestiona actualmente estas rutas:

| Ruta | Página | Estado |
| --- | --- | --- |
| `/` | `HomePage` | Home visual aprobada |
| `/productos` | `ProductsPage` | Catálogo visual y funcional con estado local |
| `/productos/:id` | `ProductDetailPage` | Ficha visual de cada producto y estado no encontrado |
| `/login` | `LoginPage` | Inicio de sesión conectado al backend |
| `/registro` | `RegisterPage` | Registro conectado al backend y confirmación de correo |
| `/carrito` | `CartPage` | Carrito protegido y exclusivo del rol `CLIENTE` |
| `/mi-cuenta` | `AccountPage` | Perfil protegido para cualquier usuario autenticado |

Los enlaces canónicos del catálogo utilizan los identificadores descriptivos de `products.js`, por ejemplo `/productos/shampoo-natural`. La ficha también admite el alias numérico correspondiente —por ejemplo `/productos/1`— para facilitar pruebas. La arquitectura queda preparada para incorporar posteriormente `/checkout` y una ruta independiente de pedidos, pero esas rutas ni sus páginas se implementan todavía. Las demás rutas desconocidas vuelven a la Home y no se muestran enlaces rotos.

`ProductsPage` incluye:

- Hero compacto con `src/assets/images/promotional/00_nexvitria_brand_panel.png`. El archivo `00` es un panel promocional independiente y no forma parte del catálogo de productos.
- Las 17 imágenes oficiales de demostración de `src/assets/images/products/`, numeradas consecutivamente de `01` a `17`, sin renombrarlas, moverlas ni editarlas.
- Búsqueda instantánea por nombre, categoría y descripción, normalizada para admitir consultas sin tildes.
- Filtros por Todos, Cuidado capilar, Cuidado corporal, Cuidado facial, Higiene personal y Bienestar.
- Categoría opcional en query string, por ejemplo `/productos?categoria=cuidado-capilar`.
- Contador reactivo de resultados.
- Ordenamiento por relevancia, precio ascendente/descendente y nombre A–Z/Z–A.
- Estado sin resultados con una acción que restablece búsqueda, categoría y ordenamiento.
- Grid responsive de una, dos, tres o cuatro columnas según el ancho disponible.
- `ProductCard` reutilizable con imagen, badge opcional, categoría, descripción, precio y navegación real a la ficha correspondiente mediante React Router.

Los 17 productos, sus categorías, descripciones, badges, indicadores visuales de disponibilidad y precios se centralizan temporalmente en `src/data/products.js`. Cada producto tiene asociada exactamente su imagen numerada correspondiente. Los precios son valores demostrativos en COP; no representan precios definitivos ni información de una base de datos. La Home, sus productos destacados, el Hero Carousel y el catálogo consumen el mismo archivo y muestran la misma imagen para una misma referencia.

Las imágenes numeradas `01`–`17` son las imágenes principales oficiales de demostración de NexVitria. No deben reemplazarse por ilustraciones CSS cuando exista el PNG del producto. Los contenedores visuales utilizan `object-fit: contain` para conservar tapa, envase, nombre, parte inferior y composición completa.

`ScrollToTop.jsx` lleva cada nueva ruta al inicio y resuelve el desplazamiento a hashes internos. Las secciones de la Home incluyen `scroll-margin-top` para que el Header sticky no cubra sus títulos.

Los productos y precios del catálogo continúan siendo datos mock locales. La comunicación de autenticación sí utiliza `fetch` mediante una capa central; no se usa Axios ni se conecta Supabase directamente desde el frontend.

### Detalle de producto

`ProductDetailPage` obtiene toda la información desde la misma fuente `src/data/products.js`; no mantiene un segundo arreglo ni duplica productos. El archivo compartido incorpora presentaciones, características y orientaciones de rutina moderadas y demostrativas para las 17 referencias. Los precios, disponibilidad, presentación y textos complementarios siguen siendo datos mock y no representan información de inventario o comercio conectada.

La ficha incluye breadcrumb semántico, imagen oficial completa con `object-fit: contain`, categoría, badge, nombre, descripción, precio demostrativo y disponibilidad visual. El selector de cantidad funciona entre 1 y 10. Una cuenta `CLIENTE` puede agregar esa cantidad al carrito; un visitante recibe acceso a Login con un `redirect` interno seguro y los roles `EMPLEADO` y `ADMINISTRADOR` reciben un aviso de disponibilidad exclusiva para clientes. `Comprar ahora` agrega la selección y abre `/carrito`, sin iniciar checkout.

Al final se muestran cuatro productos relacionados, priorizando la misma categoría, excluyendo siempre el producto abierto y reutilizando `ProductCard`. Navegar entre ellos actualiza el contenido y devuelve la página al inicio mediante `ScrollToTop`. Un identificador inexistente muestra `Producto no encontrado` con acciones para volver al catálogo o a la Home, sin romper el layout compartido.

El título del documento se actualiza a `[Nombre del producto] | NexVitria` o `Producto no encontrado | NexVitria`, y se restaura al salir de la página.

## Autenticación y carrito

La autenticación consume el backend de NexVitria mediante `src/services/apiClient.js` y `src/services/authService.js`. La URL se obtiene de `VITE_API_URL`; el fallback de desarrollo es `http://localhost:3000`. `frontend/.env.example` documenta el valor local. Para una prueba LAN puede utilizarse temporalmente `VITE_API_URL=http://IP_DEL_PC:3000`, sin incorporar una IP personal al código.

El backend expone `POST /api/auth/login`, `POST /api/auth/registro`, `GET /api/auth/me` y `POST /api/auth/logout`. Login y Registro devuelven únicamente el `access_token` y sus tiempos de expiración cuando existe sesión; nunca exponen el `refresh_token`. Después de recibir el token, `AuthContext` consulta `/api/auth/me` y utiliza exclusivamente el perfil validado desde `public.profiles` para determinar `rol` y `activo`.

El access token se conserva provisionalmente en `sessionStorage` con la clave `nexvitria_access_token`. No se guardan contraseña, refresh token ni roles provenientes de metadata. Al recargar, la presencia del token no basta para autenticar: se valida nuevamente con `/api/auth/me`. Las respuestas 401/403 o cualquier restauración fallida eliminan la sesión local. Todavía no existe renovación automática segura; cuando el access token expira, la persona debe iniciar sesión nuevamente.

El registro solicita nombre, apellido, correo, contraseña y un teléfono opcional. Un teléfono vacío se normaliza como `null`; si se informa, se aceptan formatos habituales de entre 7 y 15 dígitos. El backend crea la identidad en `auth.users` y su perfil asociado en `public.profiles` con el rol seguro `CLIENTE`, sin aceptar `rol` ni `activo` desde el formulario público. La contraseña replica la política del backend: mínimo ocho caracteres, mayúscula, minúscula, número y carácter especial. Cuando Supabase no entrega sesión porque exige confirmación, la interfaz muestra `Cuenta creada. Revisa tu correo electrónico para confirmar tu cuenta.` sin crear una sesión ficticia.

`CartContext` solo se habilita cuando el perfil verificado cumple simultáneamente `activo === true` y `rol === "CLIENTE"`. El Header muestra el carrito únicamente bajo esa condición. El badge suma unidades, no referencias diferentes, y limita su representación visual a `99+`. `EMPLEADO`, `ADMINISTRADOR` y visitantes no ven el icono ni pueden agregar productos.

El carrito todavía no persiste en backend. `localStorage` se utiliza exclusivamente para guardar pares `productId`/`quantity`, separados por la clave `nexvitria_cart_<userId>`; los datos completos del producto se reconstruyen desde `products.js`. Cambiar de usuario remonta el estado del carrito y carga únicamente la clave de esa cuenta. Logout revoca la sesión en el backend, elimina el token de `sessionStorage` y vacía el carrito en memoria sin borrar la selección persistida del cliente.

`/carrito` exige una sesión válida de rol `CLIENTE`. Permite modificar cantidades de 1 a 10, eliminar productos y calcula subtotales enteros en COP. `Continuar compra` solo informa que el proceso se implementará posteriormente: no existen checkout, pedidos, pagos ni pasarela.

El backend configura CORS con la lista explícita `FRONTEND_ORIGINS` de `backend/.env.example`. Admite valores separados por comas para desarrollo local o LAN y nunca utiliza `*`.

## Mi cuenta, avatar y presencia local

`/mi-cuenta` es una ruta protegida para cualquier usuario autenticado. Mientras `AuthContext` valida la sesión muestra un estado de carga discreto; un visitante se redirige a `/login?redirect=/mi-cuenta`. La página consume exclusivamente el perfil recuperado mediante `/api/auth/me` y muestra nombre, apellido, correo, teléfono, rol y estado de cuenta en modo de solo lectura. Los teléfonos nulos o vacíos se presentan como `No registrado`.

`UserAvatar` se reutiliza en el Header y en la cabecera de Mi cuenta. Está preparado para aceptar en el futuro una URL opcional, pero actualmente no existe una foto real de perfil, carga ni integración con Storage: siempre se presenta un fallback SVG de usuario. El avatar incluye un indicador de presencia con texto complementario en las superficies que explican el estado.

El Header autenticado reemplaza el saludo y cierre de sesión directos por `UserMenu`. El menú muestra `Hola, Nombre`, el correo validado, el selector de presencia, `Mi perfil` y `Cerrar sesión`. Solo el rol `CLIENTE` ve además `Mis pedidos`, que enlaza a `/mi-cuenta#pedidos`; `EMPLEADO` y `ADMINISTRADOR` no ven esa opción. El carrito conserva su contexto, badge y navegación actuales y continúa visible exclusivamente para `CLIENTE`.

`PresenceContext` mantiene cuatro estados locales: `ONLINE` (En línea, verde), `AWAY` (Ausente, ámbar), `BUSY` (Ocupado, rojo) y `OFFLINE` (Aparecer desconectado, gris). Si la preferencia efectiva es En línea, cinco minutos exactos sin actividad cambian el estado automáticamente a Ausente; la siguiente actividad restaura En línea. Se consideran movimiento y pulsación de puntero, teclado, click, scroll, interacción táctil y retorno visible de la pestaña, con limitación de frecuencia para movimientos continuos.

Ocupado, Ausente y Aparecer desconectado seleccionados manualmente permanecen estables ante la actividad. Elegir En línea reactiva el temporizador de ausencia. Solo las selecciones manuales se guardan en `localStorage` como `{ "status": "...", "manual": true }`, bajo una clave `nexvitria_presence_<userId>` independiente para cada cuenta; la ausencia automática no se persiste. Al cerrar sesión se desmontan temporizadores y listeners, sin necesidad de borrar la preferencia manual guardada.

La pérdida real de conectividad detectada mediante `navigator.onLine` y los eventos `online`/`offline` muestra temporalmente el estado desconectado y conserva por separado la preferencia anterior para restaurarla cuando vuelve la red. Esta presencia es únicamente local al frontend: no usa backend, WebSockets, Supabase Realtime ni sincronización entre usuarios o dispositivos.

La sección `#pedidos` solo existe para `CLIENTE`, respeta el Header sticky y muestra intencionalmente un estado vacío. Todavía no existen pedidos reales ni se inventan pedidos, fechas, importes o estados de seguimiento.

## Estado actual

- El sistema visual base está creado.
- Existen componentes UI mínimos para botones y campos.
- La Home visual definitiva está creada y refinada con enfoque de empresa única.
- Las rutas `/`, `/productos`, `/productos/:id`, `/login`, `/registro`, `/carrito` y `/mi-cuenta` funcionan mediante React Router DOM.
- El catálogo local incluye búsqueda, filtros, ordenamiento, contador y estado vacío.
- Las tarjetas del catálogo, los destacados de Home y los productos relacionados abren la misma ficha compartida.
- El detalle incorpora cantidad, carrito por rol, relacionados, título dinámico y estado de producto inexistente.
- Los productos y precios visibles continúan siendo contenido mock temporal.
- Login, Registro, recuperación de perfil y Logout están conectados al backend actual.
- La autorización visual del carrito usa únicamente el rol validado por `/api/auth/me`.
- El carrito funcional permanece local y separado por usuario; todavía no existe una tabla de carrito.
- El perfil autenticado, el avatar fallback, el menú de usuario y la presencia local por cuenta están disponibles.
- La navegación entre Home, catálogo, fichas, autenticación, carrito y Mi cuenta está habilitada.
- Checkout, pagos, edición de perfil, fotos reales, pedidos reales y dashboards se construirán posteriormente.

Este README debe mantenerse actualizado conforme evolucione el frontend.
