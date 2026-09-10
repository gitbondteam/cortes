/**
 * Single source of truth for every business fact on the site.
 *
 * Nothing here may be invented: each value below comes from the supplied
 * brochure or price catalogue. See CONTENT_NOTES.md for provenance.
 */

export const site = {
  brandName: 'Cortes Argentinos',
  tagline: 'Maestros de la Carne',
  claim: 'La carne es nuestro arte, nuestra pasión.',
  domain: 'https://cortesargentinos.com.ar',
  defaultTitle: 'Cortes Argentinos | Maestros de la Carne',
  defaultDescription:
    'Cadena de carnicerías especializada en cortes de carne de las distintas regiones de Argentina. Conocé nuestro catálogo de cortes envasados al vacío en Jesús María, Córdoba.',
  locale: 'es-AR',
  lang: 'es-AR',

  /** Displayed exactly as written in the catalogue. */
  phoneDisplay: '+54 9 3525 414150',
  /** E.164 without symbols, for tel: and wa.me links. */
  phoneE164: '5493525414150',

  address: {
    street: 'Salta 633',
    city: 'Jesús María',
    region: 'Córdoba',
    country: 'Argentina',
    countryCode: 'AR',
  },

  social: {
    instagramHandle: '@cortesargentinos.arg',
    instagramUrl: 'https://www.instagram.com/cortesargentinos.arg/',
    /**
     * The brochure and catalogue only name the Facebook page as
     * "Cortes Argentinos" — no URL is given, so none is invented.
     * Add the real URL here to switch the link on across the whole site.
     */
    facebookName: 'Cortes Argentinos',
    facebookUrl: null as string | null,
  },

  /** Catalogue behaviour. */
  catalog: {
    /**
     * Prices are stored in src/data/products.ts but hidden by default:
     * this is a brand and catalogue site, not an online store.
     * Flip to `true` to reveal the red price pills everywhere.
     */
    showPrices: false,
    currency: 'ARS',
    /** Quoted from the cover of the price catalogue. */
    subtitle: 'Cortes envasados al vacío',
  },

  /** Optional sections, built but not published. */
  features: {
    /** Set to true to publish /franquicias/ and show it in the navigation. */
    franchises: false,
  },
} as const;

export type Site = typeof site;

export const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region}, ${site.address.country}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${site.brandName}, ${fullAddress}`,
)}`;
