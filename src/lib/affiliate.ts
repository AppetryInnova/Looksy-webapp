/**
 * Utility to dynamically rewrite product links with LooksApp affiliate tags.
 */

interface RewriteOptions {
  url?: string;
  productName: string;
  storeName: string;
  locale?: string; // e.g. "es", "pt", "en"
  country?: string; // e.g. "UY", "BR", "AR", "US"
}

export function getAffiliateRedirectUrl({
  url = '',
  productName,
  storeName,
  locale = 'es',
  country = 'UY'
}: RewriteOptions): string {
  const cleanStoreName = storeName.toLowerCase().trim();
  const cleanProductName = productName.trim();
  const encodedName = encodeURIComponent(cleanProductName);
  const isBrazil = country === 'BR' || locale === 'pt';

  // 1. If we have a URL, parse and inject tags if it matches known domains
  if (url && url.length > 0) {
    try {
      const parsedUrl = new URL(url);

      // --- Amazon ---
      if (parsedUrl.hostname.includes('amazon.')) {
        const tag = isBrazil
          ? (process.env.AMAZON_TAG_BR || 'looksyapp-br-21')
          : (process.env.AMAZON_TAG_US || 'looksyapp-20');
        parsedUrl.searchParams.set('tag', tag);
        return parsedUrl.toString();
      }

      // --- Mercado Libre / Mercado Livre ---
      if (parsedUrl.hostname.includes('mercadolibre.') || parsedUrl.hostname.includes('mercadolivre.')) {
        const trackId = process.env.MERCADO_LIBRE_TRACK_ID || 'looksy-p2p';
        parsedUrl.searchParams.set('trackId', trackId);
        return parsedUrl.toString();
      }

      // --- Zara ---
      if (parsedUrl.hostname.includes('zara.com')) {
        const affId = process.env.ZARA_AFFILIATE_ID || 'looksy-zara';
        parsedUrl.searchParams.set('utm_source', 'looksy');
        parsedUrl.searchParams.set('utm_medium', 'affiliate');
        parsedUrl.searchParams.set('utm_campaign', affId);
        return parsedUrl.toString();
      }

      // --- Renner ---
      if (parsedUrl.hostname.includes('renner.') || parsedUrl.hostname.includes('lojasrenner.')) {
        const affId = process.env.RENNER_AFFILIATE_ID || 'looksy-renner';
        parsedUrl.searchParams.set('utm_source', 'looksy');
        parsedUrl.searchParams.set('utm_medium', 'affiliate');
        parsedUrl.searchParams.set('utm_campaign', affId);
        return parsedUrl.toString();
      }

      // Return original URL if no matching rewriter
      return url;
    } catch (e) {
      // Invalid URL, fallback to search query construction
    }
  }

  // 2. If no URL provided (or invalid), construct a search affiliate link based on the merchant name
  if (cleanStoreName.includes('mercado libre') || cleanStoreName.includes('mercadolibre')) {
    const trackId = process.env.MERCADO_LIBRE_TRACK_ID || 'looksy-p2p';
    if (isBrazil) {
      return `https://lista.mercadolivre.com.br/${encodedName}?trackId=${trackId}`;
    } else if (country === 'UY' || locale === 'uy') {
      return `https://listado.mercadolibre.com.uy/${encodedName}?trackId=${trackId}`;
    } else {
      return `https://listado.mercadolibre.com.ar/${encodedName}?trackId=${trackId}`;
    }
  }

  if (cleanStoreName.includes('renner')) {
    const affId = process.env.RENNER_AFFILIATE_ID || 'looksy-renner';
    if (isBrazil) {
      return `https://www.lojasrenner.com.br/busca?s=${encodedName}&utm_source=looksy&utm_medium=affiliate&utm_campaign=${affId}`;
    } else {
      return `https://www.renner.com.uy/s?Ntt=${encodedName}&utm_source=looksy&utm_medium=affiliate&utm_campaign=${affId}`;
    }
  }

  if (cleanStoreName.includes('zara')) {
    const affId = process.env.ZARA_AFFILIATE_ID || 'looksy-zara';
    if (isBrazil) {
      return `https://www.zara.com/br/pt/search?searchTerm=${encodedName}&utm_source=looksy&utm_medium=affiliate&utm_campaign=${affId}`;
    } else {
      return `https://www.zara.com/uy/es/search?searchTerm=${encodedName}&utm_source=looksy&utm_medium=affiliate&utm_campaign=${affId}`;
    }
  }

  if (cleanStoreName.includes('amazon')) {
    const tag = isBrazil
      ? (process.env.AMAZON_TAG_BR || 'looksyapp-br-21')
      : (process.env.AMAZON_TAG_US || 'looksyapp-20');
    if (isBrazil) {
      return `https://www.amazon.com.br/s?k=${encodedName}&tag=${tag}`;
    } else {
      return `https://www.amazon.com/s?k=${encodedName}&tag=${tag}`;
    }
  }

  if (cleanStoreName.includes('tiendamia')) {
    return `https://tiendamia.com/${country.toLowerCase()}/search?amz=${encodedName}`;
  }

  // Fallback to Google Shopping
  const crParam = isBrazil ? 'countryBR' : 'countryUY';
  return `https://www.google.com/search?q=${encodedName}+buy+online&tbm=shop&cr=${crParam}`;
}
