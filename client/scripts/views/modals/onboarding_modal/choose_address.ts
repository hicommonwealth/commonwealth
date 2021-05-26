import 'modals/onboarding_modal/choose_address.scss';

import m, { Vnode } from 'mithril';
import $ from 'jquery';

import app, { ApiStatus } from 'state';
import { link } from 'helpers';
import { Button, Spinner } from 'construct-ui';
import { notifyError, notifyInfo } from 'controllers/app/notifications';
import { Account, ChainBase, IWebWallet } from 'models';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { networkToBase } from 'models/types';

import { createUserWithAddress } from 'controllers/app/login';
import Substrate from 'controllers/chain/substrate/main';
import Near from 'controllers/chain/near/main';

import User from 'views/components/widgets/user';

import { onboardingChooseAddressIcon } from '../../components/sidebar/icons';
import { ChainBaseIcon } from '../../components/chain_icon';
import OnboardingFooterActions from './footer_actions';
import AddressSwapper from '../../components/addresses/address_swapper';

const LinkAccountItem: m.Component<{
  account: { address: string, meta?: { name: string } },
  targetCommunity: string,
  accountVerifiedCallback: (account: Account<any>, onNext: (account: Account<any>) => void) => any,
  errorCallback: (error: string) => void,
  chooseAddressVnode: m.Vnode<IOnboardingChooseAddressAttr, IOnboardingChooseAddressState>,
  base: ChainBase,
  webWallet: IWebWallet<any>,
  onNext: (account: Account<any>) => void
}, { linking: boolean }> = {
  view: (vnode) => {
    const {
      account,
      accountVerifiedCallback,
      errorCallback,
      chooseAddressVnode,
      targetCommunity,
      base,
      webWallet,
      onNext
    } = vnode.attrs;
    const address = base === ChainBase.Substrate
      ? AddressSwapper({
        address: account.address,
        currentPrefix: (app.chain as Substrate).chain.ss58Format,
      })
      : account.address;
    const isPrepopulated = account.address === chooseAddressVnode.attrs.address
      || address === chooseAddressVnode.attrs.address;
    const name = account.meta?.name || (base === ChainBase.CosmosSDK
      ? `${app.chain.meta.chain.name} address ${account.address.slice(0, 6)}...`
      : `Ethereum address ${account.address.slice(0, 6)}...`);

    return m('.LinkAccountItem.account-item', {
      class: `${!isPrepopulated || vnode.state.linking ? 'disabled' : ''}`,
      onclick: async (e) => {
        e.preventDefault();
        if (!isPrepopulated || vnode.state.linking) return;

        // check address status if currently logged in
        if (app.isLoggedIn()) {
          const { result } = await $.post(`${app.serverUrl()}/getAddressStatus`, {
            address,
            chain: app.activeChainId(),
            jwt: app.user.jwt,
          });
          if (result.exists) {
            if (result.belongsToUser) {
              notifyInfo('This address is already linked to your current account.');
              return;
            } else {
              const modalMsg = 'This address is currently linked to another account. '
                + 'Remove it from that account and transfer to yours?';
              const confirmed = await confirmationModalWithText(modalMsg)();
              if (!confirmed) {
                vnode.state.linking = false;
                return;
              }
            }
          }
        }

        try {
          const signerAccount = await createUserWithAddress(address, undefined, targetCommunity);
          vnode.state.linking = true;
          m.redraw();
          await webWallet.validateWithAccount(signerAccount);
          vnode.state.linking = false;
          m.redraw();
          // return if user signs for two addresses
          accountVerifiedCallback(signerAccount, onNext);
        } catch (err) {
          // catch when the user rejects the sign message prompt
          vnode.state.linking = false;
          errorCallback('Verification failed');
          m.redraw();
        }
      }
    }, [
      m('.account-item-avatar', [
        m('.account-user', m(User, { user: app.chain.accounts.get(address), avatarOnly: true, avatarSize: 40 })),
      ]),
      m('.account-item-left', [
        m('.account-item-name', [
          m('.account-user', m(User, { user: app.chain.accounts.get(address), hideAvatar: true })),
        ]),
        m('.account-item-address', address), // always Ethereum, not app.chain.meta.chain.name
      ]),
    ]);
  }
};

interface IOnboardingChooseAddressAttr {
  address: string;
  joiningChain?: string;
  joiningCommunity?: string;
  base: ChainBase;
  onBack: () => void;
  onNext: (account: Account<any>) => void;
  accountVerifiedCallback: (account: Account<any>, onNext: (account: Account<any>) => void) => any,
}

interface IOnboardingChooseAddressState {
  initializingWallet: boolean;
  loadingScope: string;
}

const ChooseAddress: m.Component<IOnboardingChooseAddressAttr, IOnboardingChooseAddressState> = {
  oninit: (vnode) => {
    vnode.state.initializingWallet = false;
  },
  view: (vnode) => {
    const { accountVerifiedCallback } = vnode.attrs;

    const targetCommunity = app.community?.id;

    let content: Vnode[];
    let title = 'Choose an Address';

    const [webWallet] = app.wallets.availableWallets(vnode.attrs.base);

    if (!app.chain) {
      content = [m(Spinner, { size: 'lg', active: true })];
      title = 'Connecting to chain...';
    } else {
      if (webWallet?.accounts?.length === 0) {
        const oncreate = async (vvnode) => {
          // initialize API if needed before starting webwallet
          // avoid oninit because it may be called multiple times
          if (vnode.state.initializingWallet) return;
          vnode.state.initializingWallet = true;
          await app.chain.initApi();
          await webWallet?.enable();
          vnode.state.initializingWallet = false;
          m.redraw();
        };
        content = [m(Button, {
          class: 'account-adder',
          oncreate,
        }), m(Spinner, {
          size: 'lg',
          active: webWallet?.available,
        })];
        title = !webWallet?.available ? 'No wallet detected' : 'Connecting to chain...';
      } else {
        const walletAccounts = webWallet?.accounts?.map((account) => app.chain.base === ChainBase.Substrate ? ({ ...account,
          address: AddressSwapper({
            address: account.address,
            currentPrefix: (app.chain as Substrate).chain.ss58Format,
          }) }) : account);
        const addressIndex = walletAccounts?.findIndex((_) => app.chain.base === ChainBase.Ethereum ? _ === vnode.attrs.address : _.address === vnode.attrs.address);
        const addressFound = addressIndex >= 0;
        const sortedAccounts = addressFound ? [walletAccounts[addressIndex], ...walletAccounts.filter((_) => app.chain.base === ChainBase.Ethereum ? _ !== vnode.attrs.address : _.address !== vnode.attrs.address)] : walletAccounts;

        content = [
          !webWallet?.available && m('.get-wallet-text', [
            'Install a compatible wallet to continue',
            m('br'),
            app.chain.base === ChainBase.Substrate
              && link('a', 'https://polkadot.js.org/extension/', 'Get polkadot-js', { target: '_blank' }),
            app.chain.base === ChainBase.Ethereum
              && link('a', 'https://metamask.io/', 'Get Metamask', { target: '_blank' }),
            app.chain.base === ChainBase.CosmosSDK
              && link('a', 'https://wallet.keplr.app/', 'Get Keplr', { target: '_blank' }),
          ]),
          webWallet?.enabled && m('.accounts-caption', [
            walletAccounts?.length === 0 ? [
              m('p', 'Wallet connected, but no accounts were found.'),
            ] : !addressFound ? [
              m('p.small-text', 'We can’t find the following address in your current wallet. Please try looking in another wallet to claim it.'),
              m('div.targetAddress', vnode.attrs.address),
              m('div.targetAddress.mobile', [vnode.attrs.address?.slice(0, 10), '...', vnode.attrs.address?.slice(-10)])
            ] : '',
          ]),
          m('.accounts-list', [
            app.chain.base === ChainBase.NEAR ? [
              m(Button, {
                intent: 'primary',
                rounded: true,
                onclick: async (e) => {
                  // redirect to NEAR page for login
                  const WalletAccount = (await import('nearlib')).WalletAccount;
                  const wallet = new WalletAccount((app.chain as Near).chain.api, null);
                  if (wallet.isSignedIn()) {
                    // get rid of pre-existing wallet info to make way for new account
                    wallet.signOut();
                  }
                  const redirectUrl = `${window.location.origin}/${app.activeChainId()}/finishNearLogin`;
                  wallet.requestSignIn('commonwealth', 'commonwealth', redirectUrl, redirectUrl);
                },
                label: 'Continue to NEAR wallet'
              }),
            ] : app.chain.networkStatus !== ApiStatus.Connected ? [
            ] : [ sortedAccounts?.map(
              (addressOrAccount) => m(LinkAccountItem, {
                account: typeof addressOrAccount === 'string'
                  ? { address: addressOrAccount }
                  : addressOrAccount,
                base: app.chain.base,
                targetCommunity,
                accountVerifiedCallback,
                errorCallback: (error) => { notifyError(error); },
                chooseAddressVnode: vnode,
                webWallet,
                onNext: vnode.attrs.onNext
              })
            )],
          ])
        ];
      }
    }

    const scope = m.route.param('scope');

    return m('.OnboardingChooseAddress', [
      m('div.title', [
        m('div.icons', [
          m(ChainBaseIcon, { chainbase: networkToBase(scope), size: 40 }), // TODO: use base instead of ethereum
          m.trust(onboardingChooseAddressIcon),
        ]),
        m('h2', title),
      ]),
      m('div.content', content),
      m(OnboardingFooterActions, {
        backDisabled: false,
        nextHidden: true,
        onBack: vnode.attrs.onBack,
      })
    ]);
  },
};

export default ChooseAddress;
