import 'components/login_with_wallet_dropdown.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, PopoverMenu, MenuItem } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';
import { IWebWallet } from 'models';
import { WalletIcon } from 'views/components/chain_icon';
import { ChainBase, ChainNetwork } from 'types';
import _ from 'underscore';

// Returns a default chain for a chainbase
export function baseToNetwork(n: ChainBase): ChainNetwork {
  switch (n) {
    case ChainBase.CosmosSDK:
      return ChainNetwork.Osmosis;
    case ChainBase.Substrate:
      return ChainNetwork.Edgeware;
    case ChainBase.Ethereum:
      return ChainNetwork.Ethereum;
    case ChainBase.NEAR:
      return ChainNetwork.NEAR;
    case ChainBase.Solana:
      return ChainNetwork.Solana;
    default:
      return null;
  }
}

const LoginWithWalletDropdown: m.Component<{
  label;
  loggingInWithAddress;
  joiningChain;
  onSuccess?;
  prepopulateAddress?;
}> = {
  view: (vnode) => {
    const {
      label,
      loggingInWithAddress,
      joiningChain,
      onSuccess,
      prepopulateAddress,
    } = vnode.attrs;

    // prev and next must work whether the modal is on the web3login page, or not...which is why this is so confusing
    const prev = m.route.param('prev') ? m.route.param('prev') : m.route.get();
    const next =
      m.route.param('prev') &&
      m.route.param('prev').indexOf('web3login') === -1 &&
      m.route.param('prev') !== '/'
        ? m.route.param('prev')
        : joiningChain
        ? `/${joiningChain}`
        : m.route.get().indexOf('web3login') === -1 &&
          m.route.get().replace(/\?.*/, '') !== '/'
        ? m.route.get()
        : app.chain
        ? `/${app.chain.meta.id}`
        : '/?';
    // only redirect to home as an absolute last resort

    const web3loginParams = loggingInWithAddress
      ? { prev, loggingInWithAddress }
      : joiningChain
      ? { prev, joiningChain }
      : { prev };

    const allChains = app.config.chains.getAll();
    const sortedChainBases = [
      ChainBase.CosmosSDK,
      ChainBase.Ethereum,
      ChainBase.NEAR,
      ChainBase.Substrate,
      ChainBase.Solana,
    ].filter((base) => allChains.find((chain) => chain.base === base));

    const emptyWalletMenuItem = m(MenuItem, {
      label: m('.chain-login-label', [
        // TODO Graham 4/7/22: Better copy
        m('.chain-login-label-name', 'No wallets found'),
      ]),
    });

    const getMenuItemsForChainBase = (base: ChainBase) => {
      const wallets = app.wallets.availableWallets(base);
      const createItem = (webWallet?: IWebWallet<any>) =>
        m(MenuItem, {
          label: m('.chain-login-label', [
            webWallet &&
              m(WalletIcon, { walletName: webWallet.name, size: 20 }),
            m('.chain-login-label-name', [webWallet.label]),
          ]),
          onclick: (e) => {
            $('.Login').trigger('modalexit');
            const defaultChainId =
              webWallet?.specificChain || baseToNetwork(base);
            if (app.activeChainId()) {
              navigateToSubpage('/web3login', web3loginParams);
            } else {
              m.route.set(`${defaultChainId}/web3login`, web3loginParams);
            }
            app.modals.lazyCreate('link_new_address_modal', {
              loggingInWithAddress,
              joiningChain,
              webWallet,
              prepopulateAddress,
              successCallback: () => {
                if (next === '/?') {
                  navigateToSubpage('/');
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
          },
        });
      return wallets.map((w) => createItem(w));
    };

    let chainbase = app.chain?.meta?.base;
    if (
      !chainbase &&
      app.customDomainId() &&
      app.config.chains.getById(app.customDomainId())
    ) {
      chainbase = app.config.chains.getById(app.customDomainId()).base;
    }
    const menuItems = chainbase
      ? [...getMenuItemsForChainBase(chainbase)]
      : _.flatten(
          sortedChainBases.map((base) => getMenuItemsForChainBase(base))
        );

    if (!menuItems.length) {
      menuItems.push(emptyWalletMenuItem);
    }

    return m(PopoverMenu, {
      trigger: m(Button, {
        intent: 'primary',
        fluid: true,
        rounded: true,
        label,
      }),
      addToStack: true,
      closeOnContentClick: true,
      class: 'LoginWithWalletDropdownPopoverMenu',
      transitionDuration: 0,
      content: menuItems,
    });
  },
};

export default LoginWithWalletDropdown;
