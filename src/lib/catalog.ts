import { categories, getCategory, type Category } from '../data/categories';
import { products, type Product } from '../data/products';
import { site } from '../data/site';

/* -------------------------------------------------------------------------- */
/* Validation — runs at build time, so bad data fails the build, not the site. */
/* -------------------------------------------------------------------------- */

function validate(list: Product[]): Product[] {
  const seen = new Set<string>();
  const known = new Set<string>(categories.map((c) => c.id));

  for (const p of list) {
    if (!p.slug || !/^[a-z0-9-]+$/.test(p.slug)) {
      throw new Error(`[catalog] Invalid slug "${p.slug}" on "${p.name}" — use lowercase ASCII and hyphens.`);
    }
    if (seen.has(p.slug)) {
      throw new Error(`[catalog] Duplicate slug "${p.slug}".`);
    }
    seen.add(p.slug);

    if (!known.has(p.category)) {
      throw new Error(`[catalog] "${p.name}" references unknown category "${p.category}".`);
    }
    if (!p.image.startsWith('/products/')) {
      throw new Error(`[catalog] "${p.name}" image must live under /products/.`);
    }
    if (!p.imageAlt?.trim()) {
      throw new Error(`[catalog] "${p.name}" is missing alt text.`);
    }
    if (p.price !== undefined && !(p.price > 0)) {
      throw new Error(`[catalog] "${p.name}" has an invalid price.`);
    }
  }
  return list;
}

/** All products, alphabetical — the catalogue's natural order. */
export const allProducts: Product[] = validate(products).slice().sort((a, b) =>
  a.name.localeCompare(b.name, 'es'),
);

/** Only categories that actually have products, in declaration order. */
export const activeCategories: Category[] = categories.filter((c) =>
  allProducts.some((p) => p.category === c.id),
);

export function countIn(categoryId: string): number {
  return allProducts.filter((p) => p.category === categoryId).length;
}

export function getProduct(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export const featuredProducts: Product[] = allProducts.filter((p) => p.featured);

/**
 * Other cuts from the same category. Falls back to filling the row from the
 * rest of the catalogue so the section is never half-empty.
 */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = allProducts.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  );
  if (sameCategory.length >= limit) {
    // Window the alphabetical list around the current product so neighbouring
    // pages don't all show the same four cuts.
    const index = allProducts.findIndex((p) => p.slug === product.slug);
    const start = index % Math.max(1, sameCategory.length - limit + 1);
    return sameCategory.slice(start, start + limit);
  }
  const filler = allProducts.filter(
    (p) => p.category !== product.category && p.slug !== product.slug,
  );
  return [...sameCategory, ...filler].slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                        */
/* -------------------------------------------------------------------------- */

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: site.catalog.currency,
  maximumFractionDigits: 0,
});

/** `null` whenever prices are switched off or the product has none. */
export function formatPrice(product: Product): string | null {
  if (!site.catalog.showPrices || product.price === undefined) return null;
  // es-AR puts a non-breaking space after the symbol; the printed catalogue
  // sets it tight ("$31.300"), so close it up to match the brand.
  const amount = priceFormatter.format(product.price).replace(/ /g, '');
  const unit = product.priceUnit === 'kg' ? ' x kg' : '';
  return `${amount}${unit}`;
}

export function categoryName(id: string): string {
  return getCategory(id)?.name ?? id;
}

/** A short, factual accessible label for a card link. */
export function cardLabel(product: Product): string {
  const parts = [product.name, categoryName(product.category)];
  if (product.presentation) parts.push(product.presentation);
  return parts.join(' — ');
}
