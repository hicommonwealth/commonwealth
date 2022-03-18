import * as Icons from './cw_icons';

export const iconLookup = {
  account: Icons.CWAccount,
  create: Icons.CWCreate,
  discord: Icons.CWDiscord,
  element: Icons.CWElement,
  'external-link': Icons.CWExternalLink,
  feedback: Icons.CWFeedback,
  github: Icons.CWGithub,
  pin: Icons.CWPin,
  search: Icons.CWSearch,
  telegram: Icons.CWTelegram,
  website: Icons.CWWebsite,
  views: Icons.CWViews,
  x: Icons.CWX,
};

export type IconName = keyof typeof iconLookup;
