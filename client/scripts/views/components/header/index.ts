import 'components/header/index.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import Infinite from 'mithril-infinite';
import { Button, ButtonGroup, Icon, Icons, PopoverMenu, List, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';

import User from 'views/components/widgets/user';
import NewProposalButton from 'views/components/new_proposal_button';
import LoginModal from 'views/modals/login_modal';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NotificationsMenu from './notifications_menu';
import LoginSelector, { CurrentCommunityLabel } from './login_selector';

const Header: m.Component<{}> = {
  view: (vnode) => {
    return m('.Header', [
      m('.header-content', [
        m('.placeholder', [
          m(CurrentCommunityLabel),
        ]),
        // new proposal
        m(NewProposalButton, { fluid: false }),
        // notifications menu
        app.isLoggedIn() && m(NotificationsMenu),
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
