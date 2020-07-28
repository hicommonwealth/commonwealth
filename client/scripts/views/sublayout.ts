import 'sublayout.scss';

import m from 'mithril';
import app from 'state';
import { Button, Icons, Grid, Col } from 'construct-ui';

import NewProposalButton from 'views/components/new_proposal_button';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';

const Sublayout: m.Component<{ class: string, title?: string, rightSidebar? }> = {
  view: (vnode) => {
    const { title, rightSidebar } = vnode.attrs;

    const sublayoutHeaderRight = m('.sublayout-header-right', [
      app.isLoggedIn() && m(NewProposalButton, { fluid: false }),
      app.isLoggedIn() && m(NotificationsMenu),                         // notifications menu
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, { // invites menu
        class: 'InvitesButton',
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      m(LoginSelector),                                                 // login selector
    ]);

    return m('.Sublayout', { class: vnode.attrs.class }, [
      m(Grid, { class: 'sublayout-main' }, [
        rightSidebar ? [
          m(Col, { span: 9, class: 'sublayout-content' }, [
            title && m('.sublayout-header', [
              m('.sublayout-header-left', [
                m('h4.sublayout-header-heading', title),
              ]),
            ]),
            vnode.children,
          ]),
          m(Col, { span: 3, class: 'sublayout-right-sidebar' }, [
            m('.sublayout-header', [
              sublayoutHeaderRight,
            ]),
            rightSidebar,
          ]),
        ] : [
          m(Col, { span: 12, class: 'sublayout-content' }, [
            m('.sublayout-header', [
              m('.sublayout-header-left', [
                title && m('h4.sublayout-header-heading', title),
              ]),
              sublayoutHeaderRight,
            ]),
            vnode.children,
          ]),
        ],
      ]),
    ]);
  }
};

export default Sublayout;
