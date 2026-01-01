// Common company suffixes to remove for matching
const COMPANY_SUFFIXES = [
  'inc',
  'inc.',
  'incorporated',
  'corp',
  'corp.',
  'corporation',
  'llc',
  'l.l.c.',
  'ltd',
  'ltd.',
  'limited',
  'co',
  'co.',
  'company',
  'companies',
  'group',
  'holdings',
  'holding',
  'enterprises',
  'enterprise',
  'international',
  'intl',
  'worldwide',
  'global',
  'usa',
  'us',
  'america',
  'the',
  '&',
  'and',
];

// Company alias mapping - redirects common names to parent/current companies
// This ensures cache consistency when searching for different names of the same company
const COMPANY_ALIASES: Record<string, string> = {
  'facebook': 'Meta',
  'instagram': 'Meta',
  'whatsapp': 'Meta',
  'google': 'Alphabet',
  'youtube': 'Alphabet',
  'gmail': 'Alphabet',
  'android': 'Alphabet',
  'x': 'X Corp',
  'twitter': 'X Corp',
  'twitter inc': 'X Corp',
  'twitter, inc': 'X Corp',
  'twitter inc.': 'X Corp',
  'aws': 'Amazon',
  'whole foods': 'Amazon',
  'linkedin': 'Microsoft',
  'github': 'Microsoft',
  'xbox': 'Microsoft',
  'tiktok': 'ByteDance',
  'snapchat': 'Snap Inc',
  'venmo': 'PayPal',
  'cash app': 'Block Inc',
  'square': 'Block Inc',
  'chick fil a': 'Chick-fil-A',
  'chickfila': 'Chick-fil-A',
  'chic fil a': 'Chick-fil-A',
};

/**
 * Resolve company aliases to their canonical/parent company name
 * e.g., "facebook" -> "Meta", "twitter" -> "X Corp", "x" -> "X Corp"
 */
export function resolveCompanyAlias(name: string): string {
  const normalized = name.toLowerCase().trim();
  return COMPANY_ALIASES[normalized] || name;
}

/**
 * Normalize a company name for database storage and matching.
 * This ensures "Nike", "nike", "Nike Inc.", "NIKE, Inc." all match.
 */
export function normalizeCompanyName(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Remove punctuation except spaces
  normalized = normalized.replace(/[.,\-'"""'']/g, ' ');

  // Split into words
  let words = normalized.split(/\s+/).filter(Boolean);

  // Remove common suffixes
  words = words.filter(word => !COMPANY_SUFFIXES.includes(word));

  // Rejoin and clean up multiple spaces
  normalized = words.join(' ').trim();

  return normalized;
}

/**
 * Create a search key for the company (used as document ID)
 * First resolves aliases, then normalizes the name
 */
export function createCompanyKey(name: string): string {
  // First resolve any aliases (twitter -> X Corp, facebook -> Meta)
  const resolved = resolveCompanyAlias(name);
  const normalized = normalizeCompanyName(resolved);
  // Replace spaces with underscores for document ID
  return normalized.replace(/\s+/g, '_');
}

/**
 * Check if two company names likely refer to the same company
 */
export function isSameCompany(name1: string, name2: string): boolean {
  return normalizeCompanyName(name1) === normalizeCompanyName(name2);
}

/**
 * Calculate days since a date
 */
export function daysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
