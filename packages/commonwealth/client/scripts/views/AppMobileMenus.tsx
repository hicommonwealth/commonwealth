import React from 'react';

import app from 'state';
import { CreateContentMenu } from './menus/create_content_menu';
import { HelpMenu } from './menus/help_menu';
import { MainMenu } from './menus/main_menu';
import { NotificationsMenu } from './menus/notifications_menu';

const mobileMenuLookup = {
  CreateContentMenu,
  HelpMenu,
  MainMenu,
  NotificationsMenu,
};

export type MobileMenuName = keyof typeof mobileMenuLookup;

export const AppMobileMenus = () => {
  const ActiveMenu = mobileMenuLookup[app.mobileMenu];

  return <ActiveMenu />;
};
