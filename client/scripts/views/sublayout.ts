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
      // new proposal
      m(NewProposalButton, { fluid: false }),
      // notifications menu
      app.isLoggedIn() && m(NotificationsMenu),
      // invites menu
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, {
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      // login selector
      m(LoginSelector),
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
