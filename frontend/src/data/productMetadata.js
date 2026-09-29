const PRODUCT_METADATA = {
  'shampoo-natural': {
    badge: 'Destacado',
    featured: true,
    presentation: '300 ml',
    heroOrder: 1,
    heroVariant: 'hair',
  },
  'acondicionador-nutritivo': {
    badge: 'Nutrición',
    featured: false,
    presentation: '300 ml',
  },
  'aceite-corporal-hidratante': {
    badge: 'Bienestar',
    featured: true,
    presentation: '120 ml',
    heroOrder: 2,
    heroVariant: 'body',
  },
  'crema-hidratante-corporal': {
    badge: 'Cuidado diario',
    featured: true,
    presentation: '250 g',
    heroOrder: 3,
    heroVariant: 'cream',
  },
  'jabon-artesanal': {
    badge: 'Artesanal',
    featured: true,
    presentation: '100 g',
  },
  'balsamo-labial-natural': {
    badge: null,
    featured: false,
    presentation: '15 g',
  },
  'gel-limpiador-facial': {
    badge: 'Rutina facial',
    featured: false,
    presentation: '200 ml',
    heroOrder: 4,
    heroVariant: 'facial',
  },
  'bruma-relajante': {
    badge: 'Momento de calma',
    featured: false,
    presentation: '120 ml',
  },
  'exfoliante-corporal': {
    badge: null,
    featured: false,
    presentation: '250 g',
  },
  'desodorante-natural': {
    badge: 'Uso diario',
    featured: false,
    presentation: '60 g',
  },
  'mascarilla-capilar-reparadora': {
    badge: 'Tratamiento',
    featured: false,
    presentation: '250 g',
  },
  'tonico-facial-equilibrante': {
    badge: null,
    featured: false,
    presentation: '200 ml',
  },
  'crema-de-manos': {
    badge: null,
    featured: false,
    presentation: '75 ml',
  },
  'body-mist-energizante': {
    badge: 'Energizante',
    featured: false,
    presentation: '150 ml',
  },
  'shampoo-anticaspa': {
    badge: null,
    featured: false,
    presentation: '300 ml',
  },
  'agua-micelar': {
    badge: 'Limpieza suave',
    featured: false,
    presentation: '250 ml',
  },
  'crema-facial-nocturna': {
    badge: 'Rutina nocturna',
    featured: false,
    presentation: '50 g',
  },
}

const CATEGORY_METADATA = {
  'cuidado-capilar': {
    icon: 'hair',
    description: 'Shampoo, tratamientos y esenciales para acompañar la salud de tu cabello.',
    features: [
      'Pensado para una rutina capilar cotidiana',
      'Textura de aplicación sencilla',
      'Complementa hábitos personales de cuidado',
    ],
    usage: 'Incorpóralo a tu rutina capilar habitual según el momento de cuidado que prefieras.',
  },
  'cuidado-corporal': {
    icon: 'body',
    description: 'Aceites, cremas y fórmulas para nutrir la piel y disfrutar cada rutina.',
    features: [
      'Cuidado corporal para el día a día',
      'Textura pensada para una aplicación cómoda',
      'Acompaña momentos de bienestar personal',
    ],
    usage: 'Úsalo como parte de tu rutina corporal cotidiana, con una aplicación suave y consciente.',
  },
  'cuidado-facial': {
    icon: 'wellness',
    description: 'Esenciales de limpieza e hidratación para acompañar tu rutina facial cotidiana.',
    features: [
      'Pensado para una rutina facial cotidiana',
      'Aplicación sencilla dentro del cuidado diario',
      'Sensación ligera y confortable',
    ],
    usage: 'Intégralo a tu rutina facial en el paso que corresponda, evitando el contacto directo con los ojos.',
  },
  'higiene-personal': {
    icon: 'hygiene',
    description: 'Esenciales diarios para una sensación de limpieza, frescura y confianza.',
    features: [
      'Esencial para hábitos de higiene cotidiana',
      'Formato práctico para el cuidado personal',
      'Experiencia de uso sencilla',
    ],
    usage: 'Utilízalo dentro de tus hábitos habituales de higiene y cuidado personal.',
  },
  bienestar: {
    icon: 'wellness',
    description: 'Productos seleccionados para crear momentos de calma, equilibrio y cuidado.',
    features: [
      'Pensado para momentos de cuidado personal',
      'Formato fácil de incorporar a la rutina',
      'Experiencia ligera para el día a día',
    ],
    usage: 'Incorpóralo a tus momentos cotidianos de cuidado según tus preferencias personales.',
  },
}

export function createMetadataSlug(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getCategoryMetadata(categoryName) {
  return CATEGORY_METADATA[createMetadataSlug(categoryName)] ?? null
}

export function attachProductMetadata(product) {
  const productMetadata = PRODUCT_METADATA[createMetadataSlug(product.name)] ?? {}
  const categoryMetadata = getCategoryMetadata(product.category?.name)

  return {
    ...product,
    badge: productMetadata.badge ?? null,
    featured: productMetadata.featured === true,
    presentation: productMetadata.presentation ?? null,
    features: categoryMetadata?.features ?? [],
    usage: categoryMetadata?.usage ?? null,
    heroOrder: productMetadata.heroOrder ?? null,
    heroVariant: productMetadata.heroVariant ?? null,
  }
}
