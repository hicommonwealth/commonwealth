import * as Icons from './cw_icons';

export const iconLookup = {
  account: Icons.CWAccount,
  create: Icons.CWCreate,
  discord: Icons.CWDiscord,
  'external-link': Icons.CWExternalLink,
  feedback: Icons.CWFeedback,
  search: Icons.CWSearch,
  views: Icons.CWViews,
};

export type IconName = keyof typeof iconLookup;
