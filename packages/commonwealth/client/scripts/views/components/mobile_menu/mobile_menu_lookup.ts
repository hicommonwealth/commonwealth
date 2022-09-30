import { CreateContentMenu } from '../../menus/create_content_menu';
import { HelpMenu } from '../../menus/help_menu';

export const mobileMenuLookup = {
  createContent: CreateContentMenu,
  help: HelpMenu,
  // main: MainMenu,
};

export type MobileMenuName = keyof typeof mobileMenuLookup;
