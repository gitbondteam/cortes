import { site } from '../data/site';
import type { Product } from '../data/products';
import { categoryName } from './catalog';

const url = (path: string) => new URL(path, site.domain).href;

/**
 * Conservative LocalBusiness node. Only facts present in the source material:
 * no hours, no coordinates, no postal code, no price range, no ratings.
 */
export function localBusinessSchema() {
  const sameAs = [site.social.instagramUrl, site.social.facebookUrl].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url('/#business'),
    name: site.brandName,
    slogan: site.tagline,
    description: site.defaultDescription,
    url: site.domain,
    image: url('/images/og.jpg'),
    logo: url('/brand/logo-light.svg'),
    telephone: `+${site.phoneE164}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.countryCode,
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * Product node. `offers` is deliberately omitted while prices are hidden —
 * publishing Offer data for a catalogue with no visible price would be wrong.
 */
export function productSchema(product: Product) {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url(`/catalogo/${product.slug}/#product`),
    name: product.name,
    image: url(product.image),
    category: categoryName(product.category),
    url: url(`/catalogo/${product.slug}/`),
    brand: { '@type': 'Brand', name: site.brandName },
  };

  if (product.description) node.description = product.description;

  if (site.catalog.showPrices && product.price !== undefined) {
    node.offers = {
      '@type': 'Offer',
      priceCurrency: site.catalog.currency,
      price: product.price,
      availability: 'https://schema.org/InStock',
      url: url(`/catalogo/${product.slug}/`),
      eligibleQuantity: { '@type': 'QuantitativeValue', unitCode: 'KGM' },
    };
  }

  return node;
}

export function breadcrumbSchema(trail: { label: string; href?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: url(item.href) } : {}),
    })),
  };
}
