/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { CWPopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { MenuItem } from '../components/component_kit/types';
import { FeedbackModal } from '../modals/feedback_modal';

const gethelpMenuItems = (): Array<MenuItem> => {
  return [
    {
      label: 'Send Feedback',
      onClick: () => app.modals.create({ modal: FeedbackModal }),
    },
    {
      label: 'Help',
      onClick: () => window.open('https://docs.commonwealth.im/commonwealth/'),
    },
  ];
};

export class HelpMenu extends ClassComponent {
  view() {
    return (
      <CWMobileMenu
        className="HelpMenu"
        menuHeader={{
          label: 'Help',
          onClick: () => {
            app.mobileMenu = 'MainMenu';
          },
        }}
        menuItems={gethelpMenuItems()}
      />
    );
  }
}

export class HelpMenuPopover extends ClassComponent {
  view() {
    return (
      <CWPopoverMenu
        trigger={<CWIconButton iconButtonTheme="black" iconName="help" />}
        menuItems={gethelpMenuItems()}
      />
    );
  }
}
