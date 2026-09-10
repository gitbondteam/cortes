import { site } from '../data/site';

/** Builds a wa.me link with a pre-filled, correctly encoded message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.phoneE164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const generalEnquiry = `Hola, quisiera hacer una consulta sobre ${site.brandName}.`;

export function productEnquiry(productName: string): string {
  return `Hola, quisiera consultar por ${productName}.`;
}

export const telLink = `tel:+${site.phoneE164}`;
