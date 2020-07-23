import 'sublayout.scss';

import m from 'mithril';
import app from 'state';
import { Button, Icons, Grid, Col } from 'construct-ui';

import NewProposalButton from 'views/components/new_proposal_button';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';

const Sublayout: m.Component<{ class: string, leftSidebar?, rightSidebar? }> = {
  view: (vnode) => {
    const { leftSidebar, rightSidebar } = vnode.attrs;

    const sublayoutHeader = m('.sublayout-header', [
      m('.sublayout-header-left', [
        m('h4.sublayout-header-heading', 'Discussions'),
      ]),
      m('.sublayout-header-right', [
        m(NewProposalButton, { fluid: false }),                           // new proposal
        app.isLoggedIn() && m(NotificationsMenu),                         // notifications menu
        app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, { // invites menu
          class: 'InvitesButton',
          iconLeft: Icons.MAIL,
          onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
        }),
        m(LoginSelector),                                                 // login selector
      ]),
    ]);

    return m('.Sublayout', { class: vnode.attrs.class }, [
      m(Grid, { class: 'sublayout-main' }, [
        m(Col, { span: 12, class: 'sublayout-content' }, [
          sublayoutHeader,
          vnode.children,
        ]),
        // m('.right-sidebar', rightSidebar),
      ]),
    ]);
  }
};

export default Sublayout;
