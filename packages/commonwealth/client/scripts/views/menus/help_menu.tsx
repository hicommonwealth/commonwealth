/* @jsx m */

import m from 'mithril';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { CWPopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { FeedbackModal } from '../modals/feedback_modal';

const helpMenuItems = [
  {
    label: 'Send Feedback',
    onclick: () => app.modals.create({ modal: FeedbackModal }),
  },
  {
    type: 'divider',
  },
  {
    label: 'Help',
    onclick: () => window.open('https://docs.commonwealth.im/commonwealth/'),
  },
];

export class HelpMenu implements m.ClassComponent {
  view() {
    return (
      <CWMobileMenu
        menuHeader={{
          label: 'Help',
          onclick: (e) => {
            app.mobileMenu = 'MainMenu';
          },
        }}
        className="HelpMenu"
        menuItems={helpMenuItems}
      />
    );
  }
}

export class HelpMenuPopover implements m.ClassComponent {
  view() {
    return (
      <CWPopoverMenu
        trigger={<CWIconButton iconButtonTheme="black" iconName="help" />}
        menuAttrs={{
          align: 'left',
        }}
        menuItems={helpMenuItems}
      />
    );
  }
}
