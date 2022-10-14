import { HelpMenu } from '../../menus/help_menu';
import { CreateContentMenu } from '../../menus/create_content_menu';
import { MainMenu } from '../../menus/main_menu';
import { NotificationsMenu } from '../../menus/notifications_menu';

export const mobileMenuLookup = {
  CreateContentMenu,
  HelpMenu,
  MainMenu,
  NotificationsMenu,
};

export type MobileMenuName = keyof typeof mobileMenuLookup;
