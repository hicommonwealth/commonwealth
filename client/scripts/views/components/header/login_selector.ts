import 'components/header/login_selector.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import { Button, ButtonGroup, Icon, Icons, List, ListItem, Menu, MenuItem, MenuDivider,
         Popover, PopoverMenu } from 'construct-ui';

import app from 'state';
import { getRoleInCommunity } from 'helpers';
import { initAppState } from 'app';
import { notifySuccess } from 'controllers/app/notifications';

import User, { UserBlock } from 'views/components/widgets/user';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import LoginModal from 'views/modals/login_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import EditProfileModal from 'views/modals/edit_profile_modal';
import FeedbackModal from 'views/modals/feedback_modal';
import SelectAddressModal from 'views/modals/select_address_modal';
import { setActiveAccount } from 'controllers/app/login';

const LoginSelector : m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return m('.LoginSelector', [
      m('.login-selector-user', [
        m(Button, {
          intent: 'primary',
          iconLeft: Icons.USER,
          size: 'sm',
          fluid: true,
          label: 'Log in',
          onclick: () => app.modals.create({ modal: LoginModal }),
        }),
      ]),
    ]);

    const activeAddressesWithRole = app.login.activeAddresses.filter((account) => {
      return getRoleInCommunity(account, app.activeChainId(), app.activeCommunityId());
    });

    return m('.LoginSelector', [
      m(ButtonGroup, { fluid: true }, [
        m(Popover, {
          class: 'login-selector-popover',
          closeOnContentClick: true,
          transitionDuration: 0,
          hoverCloseDelay: 0,
          position: 'top-end',
          trigger: m(Button, {
            intent: 'none',
            size: 'sm',
            fluid: true,
            compact: true,
            label: (!app.chain && !app.community) ? 'No community'
              : (app.login.activeAddresses.length === 0 || app.vm.activeAccount === null) ? 'No address'
                : m(User, { user: app.vm.activeAccount }),
            iconRight: Icons.CHEVRON_DOWN,
          }),
          content: m(Menu, { class: 'LoginSelectorMenu' }, [
            // address selector - only shown in communities
            (app.chain || app.community) && [
              activeAddressesWithRole.map((account) => m(MenuItem, {
                align: 'left',
                basic: true,
                onclick: (e) => {
                  setActiveAccount(account);
                },
                label: m(UserBlock, { user: account, avatarSize: 24 }),
              })),
              m(MenuItem, {
                onclick: () => app.modals.create({
                  modal: SelectAddressModal,
                }),
                iconLeft: Icons.USER,
                label: 'Connect another address'
              }),
              m(MenuDivider),
            ],
            // always shown
            m(MenuItem, {
              onclick: () => m.route.set('/settings'),
              iconLeft: Icons.SETTINGS,
              label: 'Settings'
            }),
            m(MenuItem, {
              onclick: () => app.modals.create({ modal: FeedbackModal }),
              iconLeft: Icons.SEND,
              label: 'Send feedback',
            }),
            m(MenuItem, {
              onclick: () => {
                $.get(`${app.serverUrl()}/logout`).then(async () => {
                  await initAppState();
                  notifySuccess('Logged out');
                  m.route.set('/');
                  m.redraw();
                }).catch((err) => {
                  // eslint-disable-next-line no-restricted-globals
                  location.reload();
                });
                mixpanel.reset();
              },
              iconLeft: Icons.X_SQUARE,
              label: 'Logout'
            }),
          ]),
        }),
      ]),
    ]);
  }
};

export default LoginSelector;
