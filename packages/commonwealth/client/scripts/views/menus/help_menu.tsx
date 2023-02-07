/* @jsx jsx */
import React from 'react';

import { ClassComponent, jsx } from 'mithrilInterop';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { PopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import type { PopoverMenuItem } from '../components/component_kit/cw_popover/cw_popover_menu';
import { FeedbackModal } from '../modals/feedback_modal';

const gethelpMenuItems = (): Array<PopoverMenuItem> => {
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
            app.mobileMenuRedraw.emit('redraw');
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
      <PopoverMenu
        renderTrigger={(onclick) => (
          <CWIconButton
            iconButtonTheme="black"
            iconName="help"
            onClick={onclick}
          />
        )}
        menuItems={gethelpMenuItems()}
      />
    );
  }
}
