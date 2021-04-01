import 'components/login_web3_buttons.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, PopoverMenu, MenuItem, MenuDivider, Icon, Icons } from 'construct-ui';

import app from 'state';
import { ChainBase, ChainInfo } from 'models';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';

// TODO: store ChainBase in the database, and check for substrate/cosmos chains instead
const CHAINS_WITH_CLI = [
  'edgeware', 'kulupu', 'kusama', 'cosmos', 'edgeware-local', 'edgeware-testnet',
  'darwinia', 'phala', 'plasm', 'polkadot', 'centrifuge', 'clover',
];

const LoginWeb3Buttons: m.Component<{
  label,
  loggingInWithAddress,
  joiningChain,
  joiningCommunity,
  onSuccess?,
}, {
  next,
  web3loginParams,
}> = {
  oninit: (vnode) => {
    const { joiningChain, joiningCommunity, loggingInWithAddress } = vnode.attrs;
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

    vnode.state.web3loginParams = loggingInWithAddress ? { prev, loggingInWithAddress } : joiningChain
      ? { prev, joiningChain } : joiningCommunity ? { prev, joiningCommunity } : { prev };
  },
  view: (vnode) => {
    const { label, loggingInWithAddress, joiningChain, joiningCommunity, onSuccess } = vnode.attrs;
    const { next, web3loginParams } = vnode.state;
    const sortedChains = app.config.chains.getAll().filter((chain) => {
      return app.config.nodes.getByChain(chain.id) && app.config.nodes.getByChain(chain.id).length > 0;
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    const sortedChainsWithCLI = sortedChains.filter((chain) => CHAINS_WITH_CLI.indexOf(chain.id) !== -1);

    const getLoginButton = (chain: ChainInfo, cli?: boolean) => m(Button, {
      intent: 'primary',
      fluid: true,
      class: 'login-with-web3',
      rounded: true,
      label: [
        m(ChainIcon, { chain, size: 20 }),
        label,
        ' ',
        cli ? `for ${chain.name} (command line)` : `for ${chain.name}`,
        m(Icon, { name: Icons.CHEVRON_DOWN }),
      ],
      onclick: (e) => {
        $('.LoginWithWalletModal').trigger('modalexit');
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
      },
    });

    return [
      (app.chain && CHAINS_WITH_CLI.indexOf(app.chain.meta.chain.id) !== -1)
        ? [
          getLoginButton(app.chain.meta.chain),
          getLoginButton(app.chain.meta.chain, true)
        ] : app.chain ? [
          getLoginButton(app.chain.meta.chain)
        ] : sortedChains.map((chain) => getLoginButton(chain))
          .concat(sortedChainsWithCLI.length > 0 ? m(MenuDivider) : null)
          .concat(sortedChainsWithCLI.map((chain) => getLoginButton(chain, true)))
    ];
  }
};

export default LoginWeb3Buttons;
