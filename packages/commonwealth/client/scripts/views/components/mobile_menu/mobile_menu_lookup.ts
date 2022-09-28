import { HelpMenu } from '../header/help_menu';
import { InvitesMenu } from '../header/invites_menu';
import { NotificationsMenu } from '../header/notifications_menu';

export const mobileMenuLookup = {
  // create: CreateMenu,
  help: HelpMenu,
  invites: InvitesMenu,
  // main: MainMenu,
  notifications: NotificationsMenu,
};

export type MobileMenuName = keyof typeof mobileMenuLookup;
