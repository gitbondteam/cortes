/**
 * Franchise content, transcribed from the brochure ("NUESTRA FRANQUICIA").
 *
 * Built and kept in the repo, but only published when
 * `site.features.franchises` is true. See CONTENT_NOTES.md.
 */

export const franchiseIntro = {
  eyebrow: 'Nuestra franquicia',
  title: 'Negocio altamente rentable',
  lead: '¿Por qué invertir en nuestras franquicias?',
};

export const franchiseBenefits: string[] = [
  'Marca en pleno crecimiento.',
  'Productos de excelente calidad.',
  'Asesoramiento de zona.',
  'Capacitaciones constantes.',
  'Software de gestión.',
  'App de descuentos.',
  'Auditorías y mejora continua.',
  'Gestión de redes sociales.',
  'Publicidad corporativa.',
  'Baja inversión inicial.',
  'Fácil de operar.',
];

export interface FranchiseStep {
  step: number;
  label: string;
}

export const franchiseSteps: FranchiseStep[] = [
  { step: 1, label: 'Primer contacto con la marca' },
  { step: 2, label: 'Recolección de datos básicos' },
  { step: 3, label: 'Estudio y orientación del interesado en base a perfil y capacidad' },
  { step: 4, label: 'Intercambio de información' },
  { step: 5, label: 'Negociación con franquiciante' },
  { step: 6, label: 'Firma de reserva' },
  { step: 7, label: 'Análisis de zona de interés y local disponible' },
  { step: 8, label: 'Firma de contrato de alquiler' },
  { step: 9, label: 'Firma de contrato de franquicia' },
  { step: 10, label: 'Inicio actividades pre apertura' },
  { step: 11, label: 'Lanzamiento' },
];
