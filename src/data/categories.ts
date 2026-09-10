/**
 * Product taxonomy.
 *
 * Adding a category here is all that is needed: the catalogue filters, the
 * category chips and the related-products logic all read from this list.
 */

export interface Category {
  /** Stable id — referenced by `Product.category`. Also used in the DOM. */
  id: string;
  /** Label shown in filters, chips and breadcrumbs. */
  name: string;
  /** Short line used above the catalogue grid when the filter is active. */
  blurb: string;
}

export const categories = [
  {
    id: 'vacunos',
    name: 'Vacunos',
    blurb: 'Cortes de novillo, del asado clásico a los cortes más exclusivos.',
  },
  {
    id: 'cerdo',
    name: 'Cerdo',
    blurb: 'Cortes de cerdo para la parrilla, el horno y la cocina.',
  },
  {
    id: 'embutidos',
    name: 'Embutidos y elaborados',
    blurb: 'Chorizo, morcilla y salame para completar la picada y la parrilla.',
  },
] as const satisfies readonly Category[];

export type CategoryId = (typeof categories)[number]['id'];

const byId = new Map<string, Category>(categories.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return byId.get(id);
}
