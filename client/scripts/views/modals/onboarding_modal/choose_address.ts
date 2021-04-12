import 'modals/onboarding_modal/choose_address.scss';

import m, { Vnode } from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import app, { ApiStatus } from 'state';
import { initChain, initAppState, selectNode } from 'app';
import { isSameAccount, link } from 'helpers';
import { Button, Input, TextArea, Spinner, Checkbox } from 'construct-ui';
import { notifyError, notifyInfo } from 'controllers/app/notifications';
import { AddressInfo, Account, ChainBase } from 'models';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { baseToNetwork } from 'models/types';

import { validationTokenToSignDoc } from 'adapters/chain/cosmos/keys';
import { updateActiveAddresses, createUserWithAddress, setActiveAccount } from 'controllers/app/login';
import Substrate from 'controllers/chain/substrate/main';
import Ethereum from 'controllers/chain/ethereum/main';
import Near from 'controllers/chain/near/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import EthereumAccount from 'controllers/chain/ethereum/account';

import CodeBlock from 'views/components/widgets/code_block';
import User from 'views/components/widgets/user';
import AvatarUpload from 'views/components/avatar_upload';

import { onboardingChooseAddressIcon } from '../../components/sidebar/icons';
import { ChainBaseIcon } from '../../components/chain_icon';
import OnboardingFooterActions from './footer_actions';

interface IOnboardingChooseAddressAttr {
  joiningChain?: string;
  joiningCommunity?: string;
  base: ChainBase;
  onBack: () => void;
  onNext: (account: Account<any>) => void;
}

interface IOnboardingChooseAddressState {
  // // meta
  // step;
  // error;
  // selectedWallet: LinkNewAddressWallets;
  // // step 1 - validate address
  // userProvidedSignature: string;
  // secretPhraseSaved: boolean;
  // newAddress: Account<any>; // true if account was already initialized, otherwise it's the Account
  // linkingComplete: boolean;
  // // step 2 - create a profile
  // isNewLogin: boolean;
  // // step 3 - complete
  // hasName: boolean;
  // hasHeadline: boolean;
  // uploadsInProgress: boolean;
  // isEd25519?: boolean;
  // enteredAddress?: string;
  initializingWallet: boolean;
  // onpopstate;

  loadingScope: string;
}

const EthereumLinkAccountItem: m.Component<{
  address,
  targetCommunity,
  accountVerifiedCallback,
  errorCallback,
  linkNewAddressModalVnode
}, { linking }> = {
  view: (vnode) => {
    // TODO: implement vnode.state.linking
    const { address, accountVerifiedCallback, errorCallback, linkNewAddressModalVnode, targetCommunity } = vnode.attrs;
    return m('.EthereumLinkAccountItem.account-item', {
      onclick: async (e) => {
        e.preventDefault();
        vnode.state.linking = true;

        // check address status if currently logged in
        if (app.isLoggedIn()) {
          const { result } = await $.post(`${app.serverUrl()}/getAddressStatus`, {
            address: address.toLowerCase(),
            chain: app.activeChainId(),
            jwt: app.user.jwt,
          });

          if (result.exists) {
            if (result.belongsToUser) {
              notifyInfo('This address is already linked to your current account.');
              vnode.state.linking = false;
              return;
            } else {
              const modalMsg = 'This address is currently linked to another account. '
                + 'Remove it from that account and transfer to yours?';
              const confirmed = await confirmationModalWithText(modalMsg)();  // TODO: need another style of modal
              if (!confirmed) {
                vnode.state.linking = false;
                return;
              }
            }
          }
        }

        const api = (app.chain as Ethereum);
        const webWallet = api.webWallet;

        // Sign with the method on eth_webwallet, because we don't have access to the private key
        const signerAccount = await createUserWithAddress(address, undefined, targetCommunity) as EthereumAccount;
        const webWalletSignature = await webWallet.signMessage(signerAccount.validationToken);

        signerAccount.validate(webWalletSignature)
          .then(() => {
            // return if user signs for two addresses
            if (linkNewAddressModalVnode.state.linkingComplete) return;
            linkNewAddressModalVnode.state.linkingComplete = true;
            return accountVerifiedCallback(signerAccount);
          })
          .then(() => m.redraw())
          .catch((err) => {
            vnode.state.linking = false;
            errorCallback(
              err ? `${err?.name || 'Error'}: ${typeof err === 'string' ? err : err.message}` : 'Unknown error'
            );
            m.redraw();
          });
      },
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

const ChooseAddress: m.Component<IOnboardingChooseAddressAttr, IOnboardingChooseAddressState> = {
  oninit: (vnode) => {
    const scope = baseToNetwork(vnode.attrs.base);

    if (!app.chain && scope !== app.activeId() && vnode.state.loadingScope !== scope) {
      const scopeMatchesChain = app.config.nodes.getAll().find((n) => n.chain.id === scope);
      vnode.state.loadingScope = scope;

      selectNode(scopeMatchesChain, false).then((response) => {
        if (response) {
          initChain();
        }
      });
    }
  },
  view: (vnode) => {
    const accountVerifiedCallback = async (account: Account<any>) => {
      if (app.isLoggedIn()) {
        // existing user

        // initialize role
        try {
          // initialize AddressInfo
          // TODO: refactor so addressId is always stored on Account<any> and we can avoid this
          //
          // Note: account.addressId is set by all createAccount
          // methods in controllers/login.ts. this means that all
          // cases should be covered (either the account comes from
          // the backend and the address is also loaded via
          // AddressInfo, or the account is created on the frontend
          // and the id is available here).
          let addressInfo = app.user.addresses
            .find((a) => a.address === account.address && a.chain === account.chain.id);

          if (!addressInfo && account.addressId) {
            // TODO: add keytype
            addressInfo = new AddressInfo(account.addressId, account.address, account.chain.id, undefined);
            app.user.addresses.push(addressInfo);
          }

          // link the address to the community
          try {
            if (vnode.attrs.joiningChain
                && !app.user.getRoleInCommunity({ account, chain: vnode.attrs.joiningChain })) {
              await app.user.createRole({ address: addressInfo, chain: vnode.attrs.joiningChain });
            } else if (vnode.attrs.joiningCommunity
                       && !app.user.getRoleInCommunity({ account, community: vnode.attrs.joiningCommunity })) {
              await app.user.createRole({ address: addressInfo, community: vnode.attrs.joiningCommunity });
            }
          } catch (e) {
            // this may fail if the role already exists, e.g. if the address is being migrated from another user
          }

          // set the address as active
          await setActiveAccount(account);
          if (app.user.activeAccounts.filter((a) => isSameAccount(a, account)).length === 0) {
            app.user.setActiveAccounts(app.user.activeAccounts.concat([account]));
          }
          // TODO: set the address as default
        } catch (e) {
          console.trace(e);
          // if the address' role wasn't initialized correctly,
          // setActiveAccount will throw an exception but we should continue
        }

        // TODO: need mixpanel integration?
        if (vnode.attrs.onNext) vnode.attrs.onNext(account);
        m.redraw();
      } else {
        // log in as the new user
        await initAppState(false);
        // load addresses for the current chain/community
        if (app.community) {
          await updateActiveAddresses(undefined);
        } else if (app.chain) {
          const chain = app.user.selectedNode
            ? app.user.selectedNode.chain
            : app.config.nodes.getByChain(app.activeChainId())[0].chain;
          await updateActiveAddresses(chain);
        } else {
          notifyError('Signed in, but no chain or community found');
        }
        if (vnode.attrs.onNext) vnode.attrs.onNext(account);
        m.redraw();
      }
    };

    const targetCommunity = app.community?.id;

    let content: Vnode[];
    let title = 'Choose an Address';

    if (!app.chain) {
      content = [m(Spinner, { size: 'lg', active: true })];
      title = 'Connecting to chain...';
    } else {
      if (app.chain.webWallet?.accounts?.length === 0) {
        const oncreate = async (vvnode) => {
          // initialize API if needed before starting webwallet
          // avoid oninit because it may be called multiple times
          if (vnode.state.initializingWallet) return;
          vnode.state.initializingWallet = true;
          await app.chain.initApi();
          await app.chain.webWallet?.enable();
          vnode.state.initializingWallet = false;
          m.redraw();
        };
        if (app.chain.webWallet?.available && ((vnode.state.initializingWallet !== false && app.chain.networkStatus !== ApiStatus.Disconnected) || (app.chain.networkStatus === ApiStatus.Disconnected))) {
          content = [m(Spinner, {
            size: 'lg',
            active: true,
            oncreate
          })];
          title = 'Connecting to chain...';
        } else {
          content = [m(Button, {
            class: 'account-adder',
            intent: 'primary',
            rounded: true,
            disabled: !app.chain.webWallet?.available // disable if unavailable
              || vnode.state.initializingWallet !== false, // disable if loading, or loading state hasn't been set
            oncreate,
            onclick: async (vvnode) => {
              // initialize API if needed before starting webwallet
              if (vnode.state.initializingWallet) return;
              vnode.state.initializingWallet = true;
              await app.chain.initApi();
              await app.chain.webWallet?.enable();
              vnode.state.initializingWallet = false;
              m.redraw();
            },
            label:
              !app.chain.webWallet?.available ? 'No wallet detected' : 'Connect to wallet'
          })];
        }
      } else {
        content = [
          !app.chain.webWallet?.available && m('.get-wallet-text', [
            'Install a compatible wallet to continue',
            m('br'),
            app.chain.base === ChainBase.Substrate
              && link('a', 'https://polkadot.js.org/extension/', 'Get polkadot-js', { target: '_blank' }),
            app.chain.base === ChainBase.Ethereum
              && link('a', 'https://metamask.io/', 'Get Metamask', { target: '_blank' }),
            app.chain.base === ChainBase.CosmosSDK
              && link('a', 'https://wallet.keplr.app/', 'Get Keplr', { target: '_blank' }),
          ]),
          app.chain.webWallet?.enabled && m('.accounts-caption', [
            app.chain.webWallet?.accounts.length === 0 ? [
              m('p', 'Wallet connected, but no accounts were found.'),
            ] : app.chain.base === ChainBase.Ethereum ? [
              m('p.small-text', 'To connect with a different account, select it in your wallet, and refresh the page.'),
            ] : [
              m('p', 'Select an address:'),
              m('p.small-text', 'Look for a popup, or check your wallet/browser extension.'),
              app.chain.base === ChainBase.CosmosSDK
                && m('p.small-text', [
                  `Because ${app.chain.meta.chain.name} does not support signed verification messages, `,
                  'you will be asked to sign a no-op transaction. It will not be submitted to the chain.'
                ]),
            ],
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
            ] : app.chain.base === ChainBase.Ethereum ? [
              app.chain.webWallet?.accounts.map(
                (address) => m(EthereumLinkAccountItem, {
                  address,
                  targetCommunity,
                  accountVerifiedCallback,
                  errorCallback: (error) => { notifyError(error); },
                  linkNewAddressModalVnode: vnode,
                })
              ),
            ] : [],
          ])
        ];
      }
    }

    return m('.OnboardingChooseAddress', [
      m('div.title', [
        m('div.icons', [
          m(ChainBaseIcon, { chainbase: ChainBase.Ethereum, size: 40 }), // TODO: use base instead of ethereum
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
