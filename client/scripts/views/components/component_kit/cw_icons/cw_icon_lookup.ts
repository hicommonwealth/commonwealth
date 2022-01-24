import * as Icons from './cw_icons';

export const iconLookup = {
  'external-link': Icons.CWExternalLink,
  create: Icons.CWCreate,
  views: Icons.CWViews,
};

export type IconName = keyof typeof iconLookup;
