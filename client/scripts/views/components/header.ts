import 'components/header.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import Infinite from 'mithril-infinite';
import { Button, Icon, Icons, PopoverMenu, List, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';

import NotificationsDropdownMenu from 'views/components/notifications_dropdown_menu';
import User from 'views/components/widgets/user';
import NewProposalButton from 'views/components/new_proposal_button';
import LoginModal from 'views/modals/login_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';

const Header: m.Component<{}> = {
  view: (vnode) => {
    // user menu

    return m('.Header', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'}`
    }, [
      (app.chain || app.community) && m('.placeholder', [
        m('h4', app.chain ? app.chain.meta?.chain?.name : app.community.meta.name),
        m('.subtitle', app.chain ? app.chain.meta?.chain?.description : app.community.meta.description),
      ]),
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
