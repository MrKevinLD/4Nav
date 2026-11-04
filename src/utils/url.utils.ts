import type { GridPreset, QuickBookmark } from '../types/browser.types';

/**
 * Distinct technical container colors (Zero purple/violet/indigo per DESIGN.md)
 */
export const CONTAINER_COLORS = [
  '#3B82F6', // Electric Royal Blue (Container 1)
  '#EAB308', // Radiant Gold (Container 2)
  '#60A5FA', // Sky Sapphire (Container 3)
  '#F59E0B', // Amber Gold (Container 4)
  '#2563EB', // Deep Cobalt Blue (Container 5)
  '#D97706', // Ancient Bronze Gold (Container 6)
  '#38BDF8', // Cyan Ice Blue (Container 7)
  '#FBBF24', // Champagne Gold (Container 8)
];

export function getContainerColor(sessionNumber: number): string {
  return CONTAINER_COLORS[(sessionNumber - 1) % CONTAINER_COLORS.length];
}

/**
 * Normalizes user input from a quadrant address bar into a valid URL or search query.
 */
export function normalizeAddressInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return 'about:blank';

  if (trimmed === 'about:blank' || trimmed.startsWith('quadnav://')) {
    return trimmed;
  }

  let result = trimmed;
  if (/^https?:\/\//i.test(result)) {
    // Already has protocol
  } else if (/^(localhost|127\.0\.0\.1|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/.*)?$/i.test(result)) {
    result = `http://${result}`;
  } else {
    // Looks like a domain name (no spaces, has a dot with a 2+ char TLD)
    const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    if (!result.includes(' ') && domainPattern.test(result)) {
      result = `https://${result}`;
      if (!result.includes('/')) result = `${result}/`;
    } else {
      // Otherwise treat as a Google search
      return `https://www.google.com/search?q=${encodeURIComponent(result)}`;
    }
  }

  // RO Classic Idle: ensure quadro.html (standalone clean game engine)
  if (/^https?:\/\/play\.roclassicidle\.com\.br\/?$/i.test(result)) {
    result = 'https://play.roclassicidle.com.br/quadro.html';
  }

  return result;
}

/**
 * Extracts a clean display hostname from a URL string.
 */
export function getDisplayHost(url: string): string {
  if (!url || url === 'about:blank') return 'Início Rápido';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

/**
 * Known sites that send X-Frame-Options: DENY / SAMEORIGIN when running in standard Web Mode
 */
const KNOWN_XFO_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'x.com',
  'twitter.com',
  'github.com',
  'google.com',
  'google.com.br',
  'youtube.com',
  'reddit.com',
  'linkedin.com',
  'whatsapp.com',
  'discord.com',
];

export function isKnownFrameRestrictedDomain(url: string): boolean {
  if (!url || url === 'about:blank') return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return KNOWN_XFO_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export const QUICK_BOOKMARKS: QuickBookmark[] = [
  {
    title: 'RO Classic Idle',
    url: 'https://play.roclassicidle.com.br/quadro.html',
    category: 'Game • Multi-Conta',
    badgeColor: '#EAB308',
  },
  {
    title: 'Google',
    url: 'https://www.google.com',
    category: 'Busca & Login',
    badgeColor: '#F59E0B',
    needsProxyInWeb: true,
  },
  {
    title: 'YouTube',
    url: 'https://www.youtube.com',
    category: 'Vídeos & Streams',
    badgeColor: '#EF4444',
    needsProxyInWeb: true,
  },
  {
    title: 'Facebook (Login Isolado)',
    url: 'https://www.facebook.com',
    category: 'Social • Multi-Conta',
    badgeColor: '#06B6D4',
    needsProxyInWeb: true,
  },
  {
    title: 'WhatsApp Web',
    url: 'https://web.whatsapp.com',
    category: 'Mensagens Isoladas',
    badgeColor: '#84CC16',
  },
  {
    title: 'Discord Web',
    url: 'https://discord.com/app',
    category: 'Comunidade',
    badgeColor: '#14B8A6',
  },
  {
    title: 'Wikipedia PT',
    url: 'https://pt.wikipedia.org',
    category: 'Enciclopédia',
    badgeColor: '#3B82F6',
  },
  {
    title: 'Twitch',
    url: 'https://www.twitch.tv',
    category: 'Live Streams',
    badgeColor: '#F97316',
  },
];

export const GRID_PRESETS: GridPreset[] = [
  {
    id: 'ro-multi-4x',
    name: '4x RO Classic Idle (4 Contas na Mesma Aba)',
    description: 'Abre play.roclassicidle.com.br nos 4 quadrantes simultaneamente',
    urls: {
      q1: 'https://play.roclassicidle.com.br/quadro.html',
      q2: 'https://play.roclassicidle.com.br/quadro.html',
      q3: 'https://play.roclassicidle.com.br/quadro.html',
      q4: 'https://play.roclassicidle.com.br/quadro.html',
    },
  },
  {
    id: 'game-media-hub',
    name: 'Setup Principal (RO Idle + Google + YouTube + Livre)',
    description: 'Q1: RO Classic Idle • Q2: Google • Q3: YouTube • Q4: Speed Dial',
    urls: {
      q1: 'https://play.roclassicidle.com.br/quadro.html',
      q2: 'https://www.google.com',
      q3: 'https://www.youtube.com',
      q4: 'about:blank',
    },
  },
  {
    id: 'multi-social',
    name: 'Multi-Contas & Social (Facebook + Google + YouTube + WhatsApp)',
    description: 'Ideal para logar em contas separadas por aba',
    urls: {
      q1: 'https://www.facebook.com',
      q2: 'https://www.google.com',
      q3: 'https://www.youtube.com',
      q4: 'https://web.whatsapp.com',
    },
  },
  {
    id: 'blank-grid',
    name: 'Grade 2x2 Limpa (Início Rápido)',
    description: '4 quadrantes no painel inicial para escolha livre',
    urls: {
      q1: 'about:blank',
      q2: 'about:blank',
      q3: 'about:blank',
      q4: 'about:blank',
    },
  },
];

export function getPaneMeta(
  id: string,
  index: number
): { number: number; label: string; shortCode: string } {
  if (id === 'q1') return { number: 1, label: 'Superior Esquerdo', shortCode: 'J1' };
  if (id === 'q2') return { number: 2, label: 'Superior Direito', shortCode: 'J2' };
  if (id === 'q3') return { number: 3, label: 'Inferior Esquerdo', shortCode: 'J3' };
  if (id === 'q4') return { number: 4, label: 'Inferior Direito', shortCode: 'J4' };

  const num = index + 1;
  return {
    number: num,
    label: `Janela ${num}`,
    shortCode: `J${num}`,
  };
}

export const QUADRANT_META: Record<
  string,
  { number: number; label: string; shortCode: string }
> = {
  q1: { number: 1, label: 'Janela 1 (Sup-Esq)', shortCode: 'J1' },
  q2: { number: 2, label: 'Janela 2 (Sup-Dir)', shortCode: 'J2' },
  q3: { number: 3, label: 'Janela 3 (Inf-Esq)', shortCode: 'J3' },
  q4: { number: 4, label: 'Janela 4 (Inf-Dir)', shortCode: 'J4' },
};
