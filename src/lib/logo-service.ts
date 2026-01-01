/**
 * Logo fetching service
 * Attempts to fetch company logos from various sources
 */

/**
 * Extract domain from a URL or company name
 */
function extractDomain(input: string): string | null {
  // If it's a URL, extract the domain
  try {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const url = new URL(input);
      return url.hostname.replace('www.', '');
    }
  } catch {
    // Not a valid URL
  }

  // Try to construct a domain from company name
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+(inc|corp|corporation|llc|ltd|company|co|group|holdings)$/i, '')
    .trim()
    .replace(/\s+/g, '');

  if (cleaned) {
    return `${cleaned}.com`;
  }

  return null;
}

/**
 * Fetch logo URL for a company
 * Tries multiple sources in order of preference
 */
export async function fetchCompanyLogo(
  companyName: string,
  website?: string
): Promise<string | null> {
  const domain = website ? extractDomain(website) : extractDomain(companyName);

  if (!domain) {
    return null;
  }

  // Try logo.dev if API key is available
  const logoDevKey = process.env.LOGO_DEV_API_KEY;
  if (logoDevKey) {
    try {
      const logoDevUrl = `https://img.logo.dev/${domain}?token=${logoDevKey}&size=128&format=png`;
      const response = await fetch(logoDevUrl, { method: 'HEAD' });
      if (response.ok) {
        return logoDevUrl;
      }
    } catch {
      // Fall through to next source
    }
  }

  // Try Clearbit Logo API (free, no auth required)
  try {
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    const response = await fetch(clearbitUrl, { method: 'HEAD' });
    if (response.ok) {
      return clearbitUrl;
    }
  } catch {
    // Fall through to next source
  }

  // Try Google favicon service as last resort (gets small icon)
  try {
    const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return googleUrl; // Google always returns something
  } catch {
    // Give up
  }

  return null;
}

/**
 * Validate if a logo URL is accessible
 */
export async function validateLogoUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
