import { site } from './site';

export interface NavItem {
  href: string;
  label: string;
}

const base: NavItem[] = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo/', label: 'Catálogo' },
  { href: '/nosotros/', label: 'Nosotros' },
  { href: '/contacto/', label: 'Contacto' },
];

/** Franchise content is built but only linked when the feature flag is on. */
export const nav: NavItem[] = site.features.franchises
  ? [...base.slice(0, 3), { href: '/franquicias/', label: 'Franquicias' }, base[3]]
  : base;
