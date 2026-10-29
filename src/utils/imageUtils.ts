/**
 * Image Utilities and Resilient Fallback Handlers
 * Ensures zero broken images across avatars, tournament banners, and proofs.
 */

export const DEFAULT_ADMIN_AVATAR = './images/avatar-admin.svg';
export const DEFAULT_PLAYER_AVATAR = './images/avatar-player.svg';
export const DEFAULT_BANNER = './images/banner-stadium.svg';
export const APP_LOGO = '/assets/aistudio/IMG_20261029_230800_676_afdc1dca.jpg';


export interface AvatarPreset {
  id: string;
  label: string;
  url: string;
  color: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'striker',
    label: 'Pro Striker',
    url: './images/avatar-player.svg',
    color: '#00ff87'
  },
  {
    id: 'admin',
    label: 'Master Admin',
    url: './images/avatar-admin.svg',
    color: '#f59e0b'
  },
  {
    id: 'neon-cyan',
    label: 'Cyber Playmaker',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="48" fill="%2306121e"/><circle cx="128" cy="128" r="105" fill="none" stroke="%2300e5ff" stroke-width="4"/><path d="M50 240 C56 195, 80 175, 104 168 L114 190 L142 190 L152 168 C176 175, 200 195, 206 240 Z" fill="%2300e5ff" opacity="0.8"/><circle cx="128" cy="115" r="46" fill="%23f5d0b0"/><path d="M85 105 Q128 65 171 105 Q150 75 128 75 Q105 75 85 105 Z" fill="%2300e5ff"/></svg>',
    color: '#00e5ff'
  },
  {
    id: 'golden-champ',
    label: 'Golden Legend',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="48" fill="%231a1408"/><circle cx="128" cy="128" r="105" fill="none" stroke="%23fbbf24" stroke-width="4"/><path d="M50 240 C56 195, 80 175, 104 168 L114 190 L142 190 L152 168 C176 175, 200 195, 206 240 Z" fill="%23d97706"/><circle cx="128" cy="115" r="46" fill="%23f5d0b0"/><path d="M85 105 Q128 65 171 105 Q150 75 128 75 Q105 75 85 105 Z" fill="%23fbbf24"/><polygon points="128,45 135,65 156,65 139,78 145,98 128,85 111,98 117,78 100,65 121,65" fill="%23fbbf24"/></svg>',
    color: '#fbbf24'
  },
  {
    id: 'purple-ace',
    label: 'Shadow Ace',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="48" fill="%23130d24"/><circle cx="128" cy="128" r="105" fill="none" stroke="%23a855f7" stroke-width="4"/><path d="M50 240 C56 195, 80 175, 104 168 L114 190 L142 190 L152 168 C176 175, 200 195, 206 240 Z" fill="%237e22ce"/><circle cx="128" cy="115" r="46" fill="%23f5d0b0"/><path d="M85 105 Q128 65 171 105 Q150 75 128 75 Q105 75 85 105 Z" fill="%23a855f7"/></svg>',
    color: '#a855f7'
  },
  {
    id: 'crimson-captain',
    label: 'Crimson Captain',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="48" fill="%231a0808"/><circle cx="128" cy="128" r="105" fill="none" stroke="%23f43f5e" stroke-width="4"/><path d="M50 240 C56 195, 80 175, 104 168 L114 190 L142 190 L152 168 C176 175, 200 195, 206 240 Z" fill="%23be123c"/><circle cx="128" cy="115" r="46" fill="%23f5d0b0"/><path d="M85 105 Q128 65 171 105 Q150 75 128 75 Q105 75 85 105 Z" fill="%23f43f5e"/></svg>',
    color: '#f43f5e'
  }
];

export interface BannerPreset {
  id: string;
  label: string;
  url: string;
  description: string;
}

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'stadium',
    label: 'Night Stadium',
    url: './images/banner-stadium.svg',
    description: 'Electrifying pitch with bright stadium floodlights'
  },
  {
    id: 'trophy',
    label: 'Championship Trophy',
    url: './images/banner-trophy.svg',
    description: 'Golden championship cup with celebratory confetti'
  },
  {
    id: 'esports',
    label: 'eSports Arena',
    url: './images/banner-esports.svg',
    description: 'Neon cyber tournament stage with giant match screens'
  },
  {
    id: 'league',
    label: 'Pro League',
    url: './images/banner-league.svg',
    description: 'Round-robin star arena with championship shield'
  }
];

/**
 * Image Error Fallback Handler for Avatars
 */
export function handleAvatarError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = DEFAULT_PLAYER_AVATAR
): void {
  const target = event.currentTarget;
  if (target && target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}

/**
 * Image Error Fallback Handler for Tournament Banners
 */
export function handleBannerError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = DEFAULT_BANNER
): void {
  const target = event.currentTarget;
  if (target && target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}
