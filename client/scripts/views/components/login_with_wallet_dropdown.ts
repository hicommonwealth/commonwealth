import 'components/login_with_wallet_dropdown.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, PopoverMenu, MenuItem, MenuDivider, Icon, Icons } from 'construct-ui';

import app from 'state';
import { ChainBase } from 'models';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';

// TODO: store ChainBase in the database, and check for substrate/cosmos chains instead
const CHAINS_WITH_CLI = [
  'edgeware', 'kulupu', 'kusama', 'cosmos', 'edgeware-local', 'edgeware-testnet',
  'darwinia', 'phala', 'plasm', 'polkadot', 'centrifuge'
];

const LoginWithWalletDropdown: m.Component<{
  label,
  loggingInWithAddress,
  joiningChain,
  joiningCommunity,
  onSuccess?,
}> = {
  view: (vnode) => {
    const { label, loggingInWithAddress, joiningChain, joiningCommunity, onSuccess } = vnode.attrs;

    // prev and next must work whether the modal is on the web3login page, or not...which is why this is so confusing
    const prev = m.route.param('prev') ? m.route.param('prev') : m.route.get();
    const next = (m.route.param('prev')
                  && m.route.param('prev').indexOf('web3login') === -1
                  && m.route.param('prev') !== '/')
      ? m.route.param('prev')
      : joiningChain ? `/${joiningChain}`
        : joiningCommunity ? `/${joiningCommunity}`
          : m.route.get().indexOf('web3login') === -1 && m.route.get().replace(/\?.*/, '') !== '/' ? m.route.get()
            : app.chain ? `/${app.chain.meta.chain.id}`
              : app.community ? `/${app.community.meta.id}`
                : '/?';
    // only redirect to home as an absolute last resort

    const web3loginParams = loggingInWithAddress ? { prev, loggingInWithAddress } : joiningChain
      ? { prev, joiningChain } : joiningCommunity ? { prev, joiningCommunity } : { prev };

    const sortedChains = app.config.chains.getAll().filter((chain) => {
      return app.config.nodes.getByChain(chain.id) && app.config.nodes.getByChain(chain.id).length > 0;
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    const sortedChainsWithCLI = sortedChains.filter((chain) => CHAINS_WITH_CLI.indexOf(chain.id) !== -1);

    const getMenuItemForChain = (chain, cli?: boolean) => m(MenuItem, {
      label: m('.chain-login-label', [
        m(ChainIcon, { chain, size: 20 }),
        m('.chain-login-label-name', [
          cli ? `${chain.name} (command line)` : chain.name
        ]),
      ]),
      onclick: (e) => {
        $('.Login').trigger('modalexit');
        m.route.set(`/${chain.id}/web3login`, web3loginParams);
        app.modals.lazyCreate('link_new_address_modal', {
          loggingInWithAddress,
          joiningChain,
          joiningCommunity,
          useCommandLineWallet: !!cli,
          successCallback: () => {
            if (next === '/?') {
              m.route.set(`/${chain.id}`);
            } else {
              m.route.set(next);
            }
            m.redraw();
            setTimeout(() => {
              m.redraw();
              if (onSuccess) onSuccess();
            }, 1); // necessary because address linking may be deferred
          }
        });
      }
    });
    const menuItems = (app.chain && CHAINS_WITH_CLI.indexOf(app.chain.meta.chain.id) !== -1)
      ? [
        getMenuItemForChain(app.chain.meta.chain),
        getMenuItemForChain(app.chain.meta.chain, true)
      ] : app.chain ? [
        getMenuItemForChain(app.chain.meta.chain)
      ] : sortedChains.map((chain) => getMenuItemForChain(chain))
        .concat(sortedChainsWithCLI.length > 0 ? m(MenuDivider) : null)
        .concat(sortedChainsWithCLI.map((chain) => getMenuItemForChain(chain, true)));

    return m(PopoverMenu, {
      trigger: m(Button, {
        intent: 'primary',
        fluid: true,
        class: 'login-with-web3',
        label: [
          label,
          m(Icon, { name: Icons.CHEVRON_DOWN }),
        ]
      }),
      addToStack: true,
      closeOnContentClick: true,
      class: 'LoginWithWalletDropdownPopoverMenu',
      transitionDuration: 0,
      content: menuItems,
    });
  }
};

export default LoginWithWalletDropdown;
