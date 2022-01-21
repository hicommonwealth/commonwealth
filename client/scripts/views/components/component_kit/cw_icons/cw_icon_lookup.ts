import * as Icons from './cw_icons';

export const icons = {
  views: Icons.CWViews,
  create: Icons.CWCreate,
  'external-link': Icons.CWExternalLink,
};

export type IconName = keyof typeof icons;
