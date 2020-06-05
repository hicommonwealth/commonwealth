import 'components/header/index.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import Infinite from 'mithril-infinite';
import { Button, ButtonGroup, Icon, Icons, PopoverMenu, List, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';

import NotificationsDropdownMenu from 'views/components/notifications_dropdown_menu';
import User from 'views/components/widgets/user';
import NewProposalButton from 'views/components/new_proposal_button';
import LoginModal from 'views/modals/login_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import CommunitySelector from './community_selector';

const ToggleViewButton = {
  view: (vnode) => {
    return m(ButtonGroup, {
      class: 'ToggleViewButton',
    }, [
      m(Button, {
        iconLeft: Icons.ALIGN_LEFT,
        onclick: (e) => {
          // TODO
        }
      }),
      m(Button, {
        iconLeft: Icons.ALIGN_JUSTIFY,
        onclick: (e) => {
          // TODO
        }
      }),
    ]);
  }
};

const Header: m.Component<{}> = {
  view: (vnode) => {
    // user menu

    return m('.Header', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'}`
    }, [
      m('.placeholder', [
        m(CommunitySelector),
      ]),
      // toggle view
      m(ToggleViewButton),
      // new proposal
      m(NewProposalButton, { fluid: false }),
      // notifications menu
      app.isLoggedIn() && m(NotificationsDropdownMenu),
      // invites menu
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, {
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
    ]);
  }
};

export default Header;
