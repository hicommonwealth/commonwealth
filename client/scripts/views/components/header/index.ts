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
import LoginSelector from './login_selector';

const Header: m.Component<{}> = {
  view: (vnode) => {
    return m('.Header', [
      m('.header-content', [
        m('.placeholder', [
          m(CommunitySelector),
        ]),
        // new proposal
        m(NewProposalButton, { fluid: false }),
        // notifications menu
        app.isLoggedIn() && m(NotificationsDropdownMenu),
        // invites menu
        app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, {
          size: 'sm',
          iconLeft: Icons.MAIL,
          onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
        }),
        // login selector
        m(LoginSelector),
      ]),
    ]);
  }
};

export default Header;
