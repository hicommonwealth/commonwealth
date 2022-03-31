import * as Icons from './cw_icons';

export const iconLookup = {
  add: Icons.CWAdd,
  discord: Icons.CWDiscord,
  element: Icons.CWElement,
  externalLink: Icons.CWExternalLink,
  feedback: Icons.CWFeedback,
  github: Icons.CWGithub,
  heartEmpty: Icons.CWHeartEmpty,
  heartFilled: Icons.CWHeartFilled,
  pin: Icons.CWPin,
  profile: Icons.CWProfile,
  search: Icons.CWSearch,
  telegram: Icons.CWTelegram,
  website: Icons.CWWebsite,
  views: Icons.CWViews,
  x: Icons.CWX,
};

export type IconName = keyof typeof iconLookup;
