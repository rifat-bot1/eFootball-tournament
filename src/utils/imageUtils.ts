/**
 * Image Utilities and Resilient Fallback Handlers
 * Ensures zero broken images across avatars, tournament banners, and proofs.
 */

export const DEFAULT_ADMIN_AVATAR = './images/avatar-admin.svg';
export const DEFAULT_PLAYER_AVATAR = './images/avatar-player.svg';
export const DEFAULT_BANNER = './images/banner-stadium.svg';

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
