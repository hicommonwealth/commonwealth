/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

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

export class AppMobileMenus extends ClassComponent {
  view() {
    const ActiveMenu = mobileMenuLookup[app.mobileMenu];

    return <ActiveMenu />;
  }
}
