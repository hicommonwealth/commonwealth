import 'components/login_with_wallet_dropdown.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, PopoverMenu, MenuItem, MenuDivider, Icon, Icons } from 'construct-ui';

import app from 'state';
import { ChainBase } from 'models';
import { ChainBaseIcon } from 'views/components/chain_icon';
import { baseToNetwork } from 'models/types';

const CHAINBASE_WITH_CLI = [
  ChainBase.CosmosSDK, ChainBase.Substrate
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

    console.log(loggingInWithAddress, 'loggingInWithAddress', joiningChain, joiningCommunity);

    // I introduce one more parameter in web3loginParams because of the following case
    // When user log into a community, we let the user to select one of the chainbase wallet to sign (new flow)
    // But with the old flow, it only creates a role between the default chain vs address.
    // We should create a role between the community vs address. To indicate which community it is, `targetCommunity`
    const targetCommunity = app.community?.id;

    const web3loginParams = loggingInWithAddress ? { prev, loggingInWithAddress, targetCommunity } : joiningChain
      ? { prev, joiningChain } : joiningCommunity ? { prev, joiningCommunity } : { prev };

    const allChains = app.config.chains.getAll();
    const sortedChainBases = [ChainBase.CosmosSDK, ChainBase.Ethereum, ChainBase.NEAR, ChainBase.Substrate].filter((base) => allChains.find((chain) => chain.base === base));
    const sortedChainBasesWithCLI = sortedChainBases.filter((base) => CHAINBASE_WITH_CLI.indexOf(base) !== -1);

    const getMenuItemForChainBase = (base: ChainBase, cli?: boolean) => m(MenuItem, {
      label: m('.chain-login-label', [
        m(ChainBaseIcon, { chainbase: base, size: 20 }),
        m('.chain-login-label-name', [
          cli ? `${base} (command line)` : base
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
          useCommandLineWallet: !!cli,
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
    const chainbase = app.chain?.meta?.chain?.base;
    const menuItems = (chainbase && CHAINBASE_WITH_CLI.indexOf(chainbase) !== -1)
      ? [
        getMenuItemForChainBase(chainbase),
        getMenuItemForChainBase(chainbase, true)
      ] : app.chain ? [
        getMenuItemForChainBase(chainbase)
      ] : sortedChainBases.map((base) => getMenuItemForChainBase(base))
        .concat(sortedChainBasesWithCLI.length > 0 ? m(MenuDivider) : null)
        .concat(sortedChainBasesWithCLI.map((base) => getMenuItemForChainBase(base, true)));

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
