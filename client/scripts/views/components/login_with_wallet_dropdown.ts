import 'components/login_with_wallet_dropdown.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, PopoverMenu, MenuItem, MenuDivider, Icon, Icons } from 'construct-ui';

import app from 'state';
import { ChainBase, IWebWallet } from 'models';
import { ChainBaseIcon } from 'views/components/chain_icon';
import { baseToNetwork } from 'models/types';
import _ from 'underscore';

const CHAINBASE_WITH_CLI = [
  ChainBase.CosmosSDK, ChainBase.Substrate
];

const LoginWithWalletDropdown: m.Component<{
  label,
  loggingInWithAddress,
  joiningChain,
  joiningCommunity,
  onSuccess?,
  prepopulateAddress?,
}> = {
  view: (vnode) => {
    const {
      label,
      loggingInWithAddress,
      joiningChain,
      joiningCommunity,
      onSuccess,
      prepopulateAddress,
    } = vnode.attrs;

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

    const targetCommunity = app.community?.id;

    const web3loginParams = loggingInWithAddress ? { prev, loggingInWithAddress, targetCommunity } : joiningChain
      ? { prev, joiningChain } : joiningCommunity ? { prev, joiningCommunity } : { prev };

    const allChains = app.config.chains.getAll();
    const sortedChainBases = [
      ChainBase.CosmosSDK, ChainBase.Ethereum, ChainBase.NEAR, ChainBase.Substrate
    ].filter((base) => allChains.find((chain) => chain.base === base));
    const sortedChainBasesWithCLI = sortedChainBases.filter((b) => CHAINBASE_WITH_CLI.includes(b));

    const getMenuItemsForChainBase = (base: ChainBase, cli?: boolean) => {
      const wallets = app.wallets.availableWallets(base);
      const baseString = base.charAt(0).toUpperCase() + base.slice(1);
      const createItem = (webWallet?: IWebWallet<any>, useCli?: boolean) => m(MenuItem, {
        label: m('.chain-login-label', [
          m(ChainBaseIcon, { chainbase: base, size: 20 }),
          m('.chain-login-label-name', [
            useCli ? `${baseString} (command line)` : webWallet.label
          ]),
        ]),
        onclick: (e) => {
          $('.Login').trigger('modalexit');
          const defaultChainId = baseToNetwork(base);
          m.route.set(`/${app.chain?.id || defaultChainId}/web3login`, web3loginParams);
          app.modals.lazyCreate('link_new_address_modal', {
            loggingInWithAddress,
            joiningChain,
            joiningCommunity,
            targetCommunity,
            useCommandLineWallet: !!useCli,
            webWallet,
            prepopulateAddress,
            successCallback: () => {
              if (next === '/?') {
                m.route.set(`/${app.chain?.id || defaultChainId}`);
              } else {
                m.route.set(next);
              }
              m.redraw();
              setTimeout(() => {
                m.redraw();
                if (onSuccess) onSuccess();
              }, 1); // necessary because address linking may be deferred
            },
          });
        }
      });
      if (cli) {
        return [ createItem(undefined, cli) ];
      } else {
        return wallets.map((w) => createItem(w));
      }
    };

    const chainbase = app.chain?.meta?.chain?.base;
    const menuItems = (chainbase && CHAINBASE_WITH_CLI.indexOf(chainbase) !== -1)
      ? [
        ...getMenuItemsForChainBase(chainbase),
        ...getMenuItemsForChainBase(chainbase, true)
      ] : chainbase ? [
        ...getMenuItemsForChainBase(chainbase)
      ] : _.flatten(sortedChainBases.map((base) => getMenuItemsForChainBase(base)))
        .concat(sortedChainBasesWithCLI.length > 0 ? m(MenuDivider) : null)
        .concat(_.flatten(sortedChainBasesWithCLI.map((base) => getMenuItemsForChainBase(base, true))));

    return m(PopoverMenu, {
      trigger: m(Button, {
        intent: 'primary',
        fluid: true,
        class: 'login-with-web3',
        rounded: true,
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
