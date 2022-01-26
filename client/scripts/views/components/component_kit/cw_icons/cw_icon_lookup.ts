import * as Icons from './cw_icons';

export const iconLookup = {
  account: Icons.CWAccount,
  'external-link': Icons.CWExternalLink,
  create: Icons.CWCreate,
  discord: Icons.CWDiscord,
  feedback: Icons.CWFeedback,
  search: Icons.CWSearch,
  views: Icons.CWViews,
};

export type IconName = keyof typeof iconLookup;
