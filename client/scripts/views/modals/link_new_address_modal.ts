import 'modals/link_new_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { isU8a, isHex, stringToHex } from '@polkadot/util';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { SignerPayloadRaw } from '@polkadot/types/types/extrinsic';

import { Button, Callout, Input, TextArea, Icon, Icons, Spinner } from 'construct-ui';

import { initAppState } from 'app';
import { formatAddressShort, isSameAccount } from 'helpers';
import { AddressInfo, Account, ChainBase, ChainNetwork } from 'models';
import app, { ApiStatus } from 'state';
import { keyToMsgSend, VALIDATION_CHAIN_DATA } from 'adapters/chain/cosmos/keys';
import { updateActiveAddresses, createUserWithAddress, setActiveAccount } from 'controllers/app/login';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import Substrate from 'controllers/chain/substrate/main';
import Ethereum from 'controllers/chain/ethereum/main';
import Near from 'controllers/chain/near/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import EthereumAccount from 'controllers/chain/ethereum/account';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { ChainIcon } from 'views/components/chain_icon';
import CodeBlock from 'views/components/widgets/code_block';
import { CheckboxFormField } from 'views/components/forms';
import HedgehogLoginForm from 'views/components/hedgehog_login_form';
import User, { UserBlock } from 'views/components/widgets/user';
import AvatarUpload from 'views/components/avatar_upload';
import AddressSwapper from '../components/addresses/address_swapper';

enum LinkNewAddressSteps {
  Step1SelectWallet,
  Step2VerifyWithCLI,
  Step2VerifyWithWebWallet,
  Step2VerifyWithHedgehog,
  Step3CreateProfile,
}

enum LinkNewAddressWallets {
  Metamask,
  PolkadotJS,
  NEARWallet,
  CLIWallet,
  Hedgehog,
}

const accountVerifiedCallback = async (account: Account<any>, vnode) => {
  if (app.isLoggedIn()) {
    // existing user

    // initialize role
    try {
      // initialize AddressInfo
      let addressInfo = app.user.addresses.find((a) => a.address === account.address && a.chain === account.chain.id);
      //
      // TODO: do this in a more well-defined way...
      //
      // account.addressId is set by all createAccount methods in controllers/login.ts. this means that all cases should
      // be covered (either the account comes from the backend and the address is also loaded via AddressInfo, or the
      // account is created on the frontend and the id is available here).
      //
      // either way, we should refactor to always hold addressId on Account<any> models
      if (!addressInfo && account.addressId) {
        // TODO: add keytype
        addressInfo = new AddressInfo(account.addressId, account.address, account.chain.id, undefined);
        app.user.addresses.push(addressInfo);
      }
      // link the address to the community
      if (vnode.attrs.joiningChain
          && !app.user.getRoleInCommunity({ account, chain: vnode.attrs.joiningChain })) {
        await app.user.createRole({ address: addressInfo, chain: vnode.attrs.joiningChain });
      } else if (vnode.attrs.joiningCommunity
                 && !app.user.getRoleInCommunity({ account, community: vnode.attrs.joiningCommunity })) {
        await app.user.createRole({ address: addressInfo, community: vnode.attrs.joiningCommunity });
      }
      // set the address as active
      setActiveAccount(account);
      if (app.user.activeAccounts.filter((a) => isSameAccount(a, account)).length === 0) {
        app.user.setActiveAccounts(app.user.activeAccounts.concat([account]));
      }
      // TODO: set the address as default
    } catch (e) {
      console.trace(e);
      // if the address' role wasn't initialized correctly,
      // setActiveAccount will throw an exception but we should continue
    }

    vnode.state.newAddress = account;
    vnode.state.step = LinkNewAddressSteps.Step3CreateProfile;
    vnode.state.error = null;
    m.redraw();
    mixpanel.track('Account Creation', {
      'Step No': 2,
      'Step': 'Add Address',
      'Option': 'Wallet',
      'Scope': app.activeId(),
    });
    mixpanel.people.increment('Addresses');
    mixpanel.people.set({
      'Last Address Created': new Date().toISOString()
    });
    notifySuccess('Success! Logged in');
    $(vnode.dom).trigger('modalforceexit');
    if (vnode.attrs.successCallback) vnode.attrs.successCallback();
  } else {
    // log in as the new user
    await initAppState(false);
    // load addresses for the current chain/community
    if (app.community) {
      updateActiveAddresses(undefined);
    } else if (app.chain) {
      const chain = app.user.selectedNode
        ? app.user.selectedNode.chain
        : app.config.nodes.getByChain(app.activeChainId())[0].chain;
      updateActiveAddresses(chain);
    } else {
      notifyError('Signed in, but no chain or community found');
    }
    // if we're logging in and have a profile, we can just close out the modal
    if (account.profile && account.profile.initialized && account.profile.name) {
      $(vnode.dom).trigger('modalforceexit');
      if (vnode.attrs.successCallback) vnode.attrs.successCallback();
      notifySuccess('Success! Logged in');
    } else {
      vnode.state.step = LinkNewAddressSteps.Step3CreateProfile;
    }
    vnode.state.newAddress = account;
    vnode.state.isNewLogin = true;
    vnode.state.error = null;
    m.redraw();
  }
};

const EthereumLinkAccountItem: m.Component<{
  address,
  accountVerifiedCallback,
  errorCallback,
  linkNewAddressModalVnode
}, { linking }> = {
  view: (vnode) => {
    // TODO: implement vnode.state.linking
    const { address, accountVerifiedCallback, errorCallback, linkNewAddressModalVnode } = vnode.attrs;
    return m('.EthereumLinkAccountItem.account-item', {
      onclick: async (e) => {
        e.preventDefault();
        const api = (app.chain as Ethereum);
        const webWallet = api.webWallet;

        // Sign with the method on eth_webwallet, because we don't have access to the private key
        const signerAccount = await createUserWithAddress(address) as EthereumAccount;
        const webWalletSignature = await webWallet.signMessage(signerAccount.validationToken);

        signerAccount.validate(webWalletSignature)
          .then(() => {
            if (linkNewAddressModalVnode.state.linkingComplete) return; // return if user signs for two addresses
            linkNewAddressModalVnode.state.linkingComplete = true;
            return accountVerifiedCallback(signerAccount, linkNewAddressModalVnode);
          })
          .then(() => m.redraw())
          .catch(errorCallback);
      },
    }, [
      // m('.account-item-left', [
      //   m('.account-item-name', account.meta.name),
      //   m('.account-item-address', account.meta.name),
      // ]),
      m('.account-item-right', [
        vnode.state.linking
          ? m('.account-waiting', [
            // TODO: show a (?) icon with a tooltip explaining to check your wallet
            m(Spinner, { size: 'xs', active: true })
          ])
          : m('.account-user', m(User, { user: app.chain.accounts.get(address) })),
      ]),
    ]);
  }
};

const SubstrateLinkAccountItem: m.Component<{
  account,
  accountVerifiedCallback,
  errorCallback,
  linkNewAddressModalVnode
}, { linking }> = {
  view: (vnode) => {
    const { account, accountVerifiedCallback, errorCallback, linkNewAddressModalVnode } = vnode.attrs;
    return m('.SubstrateLinkAccountItem.account-item', {
      onclick: async (e) => {
        e.preventDefault();

        try {
          const signerAccount = await createUserWithAddress(AddressSwapper({
            address: account.address,
            currentPrefix: (app.chain as Substrate).chain.ss58Format,
          })) as SubstrateAccount;
          const signer = await (app.chain as Substrate).webWallet.getSigner(account.address);
          vnode.state.linking = true;
          m.redraw();

          const token = signerAccount.validationToken;
          const payload: SignerPayloadRaw = {
            address: signerAccount.address,
            data: stringToHex(token),
            type: 'bytes',
          };
          const signature = (await signer.signRaw(payload)).signature;
          const verified = await signerAccount.isValidSignature(token, signature);

          if (!verified) {
            vnode.state.linking = false;
            errorCallback('Verification failed');
          }
          signerAccount.validate(signature).then(() => {
            vnode.state.linking = false;
            if (linkNewAddressModalVnode.state.linkingComplete) return; // return if user signs for two addresses
            linkNewAddressModalVnode.state.linkingComplete = true;
            accountVerifiedCallback(signerAccount, vnode.attrs.linkNewAddressModalVnode);
          }, (err) => {
            vnode.state.linking = false;
            errorCallback('Verification failed');
          }).then(() => {
            m.redraw();
          }).catch((err) => {
            vnode.state.linking = false;
            errorCallback('Verification failed');
          });
        } catch (err) {
          // catch when the user rejects the sign message prompt
          vnode.state.linking = false;
          errorCallback('Verification failed');
        }
      }
    }, [
      m('.account-item-left', [
        m('.account-item-name', account.meta.name),
        // TODO: format this address correctly
        m('.account-item-address', formatAddressShort(AddressSwapper({
          address: account.address,
          currentPrefix: (app.chain as Substrate).chain.ss58Format,
        }))),
      ]),
      m('.account-item-right', [
        vnode.state.linking
          ? m('.account-waiting', [
            // TODO: show a (?) icon with a tooltip explaining to check your wallet
            m(Spinner, { size: 'xs', active: true })
          ])
          : m('.account-user', m(User, { user: app.chain.accounts.get(account.address) })),
      ]),
    ]);
  }
};

const LinkNewAddressModal: m.Component<{
  loggingInWithAddress?: boolean; // determines whether the header says "Link new address" or "Login with address"
  joiningCommunity: string,       // join community after verification
  joiningChain: string,           // join chain after verification
  alreadyInitializedAccount?: Account<any>; // skip verification, go straight to profile creation (only used for NEAR)
  successCallback;
}, {
  // meta
  step;
  error;
  // step 1 - select a wallet
  selectedWallet: LinkNewAddressWallets;
  // step 2 - validate address with a signature
  validSig: string;
  secretPhraseSaved: boolean;
  newAddress: Account<any>; // true if account was already initialized, otherwise it's the Account
  linkingComplete: boolean;
  // step 3 - create a profile
  isNewLogin: boolean;
  // step 4 - complete
  hasName: boolean;
  hasHeadline: boolean;
  uploadsInProgress: boolean;
  isEd25519?: boolean;
  enteredAddress?: string;
  cosmosStdTx?: object;
  initializingWallet: boolean;
  onpopstate;
}> = {
  // close the modal if the user moves away from the page
  oncreate: (vnode) => {
    vnode.state.onpopstate = (e) => {
      $('.LinkNewAddressModal').trigger('modalforceexit');
    };
    $(window).on('popstate', vnode.state.onpopstate);
  },
  onremove: (vnode) => {
    $(window).off('popstate', vnode.state.onpopstate);
  },
  view: (vnode) => {
    if (!app.chain) {
      // don't render a modal to avoid a loading flash here
      return;
      // // send user home to select a chain
      // return m('.LinkNewAddressModal', [
      //   m('.compact-modal-title', [
      //     m('h3', 'Select a network')
      //   ]),
      //   m('.link-address-step.select-chain-step', [
      //     m('p', 'You must select a community first...'),
      //     m(Button, {
      //       label: 'Go home',
      //       intent: 'primary',
      //       onclick: (e) => {
      //         $(e.target).trigger('modalforceexit');
      //         m.route.set('/');
      //       }
      //     }),
      //   ]),
      // ]);
    }

    if (vnode.state.step === undefined) {
      if (vnode.attrs.alreadyInitializedAccount) {
        vnode.state.step = LinkNewAddressSteps.Step3CreateProfile;
        vnode.state.newAddress = vnode.attrs.alreadyInitializedAccount;
      } else {
        vnode.state.step = LinkNewAddressSteps.Step1SelectWallet;
      }
    }

    const linkAddressHeader = m('.compact-modal-title', [
      vnode.attrs.loggingInWithAddress ? m('h3', 'Log in with address') : m('h3', 'Link new address'),
    ]);

    const isMobile = $(window).width() <= 440;

    // TODO: hack to fix linking now that keyToMsgSend is async
    if (vnode.state.newAddress) {
      keyToMsgSend(
        vnode.state.newAddress.address,
        vnode.state.newAddress.validationToken,
      ).then((stdTx) => {
        vnode.state.cosmosStdTx = stdTx;
      });
    }

    return m('.LinkNewAddressModal', [
      vnode.state.step === LinkNewAddressSteps.Step1SelectWallet ? m('.link-address-step', [
        linkAddressHeader,
        vnode.state.error && m('.error-message', vnode.state.error),
        m('p.link-address-precopy', vnode.attrs.loggingInWithAddress ? [
          'Select a wallet:'
        ] : app.user.activeAccounts.length === 0 ? [
          'Select a wallet:'
        ] : [
          m(Callout, {
            intent: 'primary',
            size: 'sm',
            icon: Icons.ALERT_TRIANGLE,
            header: 'Security warning',
            content: 'Anyone with the private keys for this address will be able to log into your Commonwealth account.'
          }),
          'Select a wallet:'
        ]),
        // wallet options
        m('.link-address-options', [
          // browser extension -- for Substrate chains
          app.chain.base === ChainBase.Substrate && m('.link-address-option', {
            class: (vnode.state.selectedWallet === LinkNewAddressWallets.PolkadotJS ? 'selected ' : ' ')
              + (((app.chain as Substrate).webWallet && (app.chain as Substrate).webWallet.available) ? '' : 'disabled'),
            onclick: (e) => {
              vnode.state.selectedWallet = LinkNewAddressWallets.PolkadotJS;
              setTimeout(() => {
                $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
              }, 10);
            }
          }, [
            m('.link-address-option-inner', [
              m('.link-address-header', [
                m('.link-address-icon', [
                  m('img', { src: '/static/img/polkadot-js.png' }),
                ]),
                m('.link-address-title', 'polkadot-js'),
              ]),
              m('.link-address-description', [
                'Browser extension by the developers of Polkadot'
              ]),
              (app.chain.base === ChainBase.Substrate) && m('.link-address-link', [
                m('a', { href: 'https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/'
                         + 'mopnmbcafieddcagagdcbnhejhlodfdd',
                target: '_blank' }, 'Chrome'),
                m.trust(' &middot; '),
                m('a', { href: 'https://addons.mozilla.org/en-US/firefox/'
                         + 'addon/polkadot-js-extension/',
                target: '_blank' }, 'Firefox'),
                m.trust(' &middot; '),
                m('a', { href: 'https://github.com/polkadot-js/extension', target: '_blank' }, 'Github'),
              ]),
            ]),
          ]),

          // browser extension -- for Ethereum option
          app.chain.base === ChainBase.Ethereum && m('.link-address-option', {
            class: (vnode.state.selectedWallet === LinkNewAddressWallets.Metamask ? 'selected ' : ' ')
              + (((app.chain as Ethereum).webWallet && (app.chain as Ethereum).webWallet.available) ? '' : 'disabled'),
            onclick: (e) => {
              vnode.state.selectedWallet = LinkNewAddressWallets.Metamask;
              if (!(app.chain as Ethereum).webWallet || !(app.chain as Ethereum).webWallet.available) return;
              setTimeout(() => {
                $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
              }, 0);
            }
          }, [
            m('.link-address-option-inner', [
              m('.link-address-header', [
                m('.link-address-icon', [
                  m('img', { src: '/static/img/metamask.png' }),
                ]),
                m('.link-address-title', 'Metamask'),
              ]),
              m('.link-address-description', 'Use a Metamask-compatible wallet'),
              m('.link-address-link', isMobile ? [
                m('a', { href: 'https://wallet.coinbase.com/', target: '_blank' }, 'Coinbase Wallet'),
                m.trust(' &middot; '),
                m('a', { href: 'https://trustwallet.com/', target: '_blank' }, 'Trust Wallet'),
              ] : [
                m('a', { href: 'https://chrome.google.com/webstore/detail/metamask/'
                          + 'nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en',
                target: '_blank' }, 'Get Metamask'),
                m.trust(' &middot; '),
                m('a', { href: 'https://brave.com/download/', target: '_blank' }, 'Get Brave'),
              ]),
            ]),
          ]),

          // cli -- cosmos-sdk and substrate chains supported
          [ChainBase.CosmosSDK, ChainBase.Substrate].indexOf(app.chain.base) !== -1 && m('.link-address-option', {
            class: (vnode.state.selectedWallet === LinkNewAddressWallets.CLIWallet ? 'selected' : '')
              + isMobile ? ' mobile-disabled' : '',
            onclick: (e) => {
              vnode.state.selectedWallet = LinkNewAddressWallets.CLIWallet;
              setTimeout(() => {
                $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
              }, 0);
            }
          }, [
            m('.link-address-option-inner', [
              m('.link-address-header', [
                m('.link-address-icon', [
                  m('img', { src: '/static/img/cli.png', style: 'position: relative; top: 2px' }),
                ]),
                app.chain.base === ChainBase.CosmosSDK && m('.link-address-title', 'gaiacli (2.0.0 or above)'),
                app.chain.base === ChainBase.Substrate && m('.link-address-title', 'subkey'),
              ]),
              m('.link-address-description', [
                'Command line utility by the developers of ',
                app.chain.base === ChainBase.CosmosSDK && 'Cosmos',
                app.chain.base === ChainBase.Substrate && 'Polkadot',
              ]),
              m('.link-address-link', [
                app.chain.base === ChainBase.CosmosSDK && m('a', {
                  target: '_blank',
                  href: 'https://cosmos.network/docs/cosmos-hub/installation.html',
                }, 'Get Gaia CLI'),
                app.chain.base === ChainBase.Substrate && m('a', {
                  target: '_blank',
                  href: 'https://substrate.dev/docs/en/ecosystem/subkey'
                }, 'Get subkey'),
              ]),
            ]),
          ]),

          // NEAR wallet
          app.chain.base === ChainBase.NEAR && m('.link-address-option', {
            class: (vnode.state.selectedWallet === LinkNewAddressWallets.NEARWallet ? 'selected' : ''),
            onclick: (e) => {
              vnode.state.selectedWallet = LinkNewAddressWallets.NEARWallet;
              // Don't proceed to next immediately, because NEAR login redirects to an external site
              // setTimeout(() => {
              //   $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
              // }, 0);
            }
          }, [
            m('.link-address-option-inner', [
              m('.link-address-header', [
                m('.link-address-icon', [
                  m('img', { src: '/static/img/near.png', style: 'position: relative; top: 2px' }),
                ]),
                m('.link-address-title', 'NEAR Wallet'),
              ]),
              m('.link-address-description', [
                'Hosted wallet by the NEAR Protocol developers'
              ]),
              m('.link-address-link', [
                m('a', { href: 'https://wallet.nearprotocol.com/', target: '_blank' }, 'wallet.nearprotocol.com'),
              ]),
            ]),
          ]),

          // Hedgehog ETH wallet
          // app.chain.base === ChainBase.Ethereum && m('.link-address-option', {
          //   class: (vnode.state.selectedWallet === LinkNewAddressWallets.Hedgehog ? 'selected' : ''),
          //   onclick: (e) => {
          //     vnode.state.selectedWallet = LinkNewAddressWallets.Hedgehog;
          //     $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
          //     // setTimeout(() => {
          //     //   $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
          //     // }, 0);
          //   }
          // }, [
          //   m('.link-address-option-inner', [
          //     m('.link-address-header', [
          //       m('.link-address-icon', [
          //         m('img', {
          //           src: '/static/img/asterisks.png',
          //           style: 'position: relative; top: 1px; height: 32px; width: initial;' +
          //             'border-radius: 30px; background: #e7e7e7;'
          //         }),
          //       ]),
          //       m('.link-address-title', 'Light wallet'),
          //     ]),
          //     m('.link-address-description', [
          //       'Create an Ethereum wallet with a username & password'
          //     ]),
          //     m('.link-address-link', [
          //       m('a', {
          //         href: 'https://github.com/AudiusProject/hedgehog',
          //         target: '_blank'
          //       }, 'Technical Details'),
          //     ]),
          //   ]),
          // ]),

        ]),
        m(Button, {
          intent: 'primary',
          class: 'link-address-options-continue',
          disabled: vnode.state.selectedWallet === undefined ? true
            : (vnode.state.selectedWallet === LinkNewAddressWallets.PolkadotJS
             && !((app.chain as Substrate).webWallet && (app.chain as Substrate).webWallet.available)) ? true
              : (vnode.state.selectedWallet === LinkNewAddressWallets.Metamask
              && !((app.chain as Ethereum).webWallet && (app.chain as Ethereum).webWallet.available)) ? true : false,
          onclick: async (e) => {
            e.preventDefault();
            if (vnode.state.selectedWallet === LinkNewAddressWallets.PolkadotJS
                || vnode.state.selectedWallet === LinkNewAddressWallets.Metamask) {
              vnode.state.step = LinkNewAddressSteps.Step2VerifyWithWebWallet;
            } else if (vnode.state.selectedWallet === LinkNewAddressWallets.CLIWallet) {
              vnode.state.step = LinkNewAddressSteps.Step2VerifyWithCLI;
            } else if (vnode.state.selectedWallet === LinkNewAddressWallets.NEARWallet) {
              // redirect to NEAR page for login
              const WalletAccount = (await import('nearlib')).WalletAccount;
              const wallet = new WalletAccount((app.chain as Near).chain.api, null);
              if (wallet.isSignedIn()) {
                // get rid of pre-existing wallet info to make way for new account
                wallet.signOut();
              }
              const redirectUrl = `${window.location.origin}/${app.activeChainId()}/finishNearLogin`;
              wallet.requestSignIn('commonwealth', 'commonwealth', redirectUrl, redirectUrl);
            } else if (vnode.state.selectedWallet === LinkNewAddressWallets.Hedgehog) {
              vnode.state.step = LinkNewAddressSteps.Step2VerifyWithHedgehog;
            } else {
              throw new Error('Unexpected wallet, we should never get here');
            }
          },
          label: vnode.state.selectedWallet === undefined ? 'Select a wallet'
            : (vnode.state.selectedWallet === LinkNewAddressWallets.PolkadotJS
               && !((app.chain as Substrate).webWallet && (app.chain as Substrate).webWallet.available)) ? 'Wallet not found'
              : (vnode.state.selectedWallet === LinkNewAddressWallets.Metamask
                 && !((app.chain as Ethereum).webWallet && (app.chain as Ethereum).webWallet.available)) ? 'Wallet not found'
                : 'Continue'
        }),
      ]) : vnode.state.step === LinkNewAddressSteps.Step2VerifyWithWebWallet ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          (app.chain as Substrate || app.chain as Ethereum).webWallet
            && (app.chain as Substrate || app.chain as Ethereum).webWallet.accounts
            && (app.chain as Substrate || app.chain as Ethereum).webWallet.accounts.length === 0
            && m(Button, {
              class: 'account-adder',
              intent: 'primary',
              disabled: !(app.chain as Substrate || app.chain as Ethereum).webWallet.available // disable if unavailable
                || vnode.state.initializingWallet !== false, // disable if loading, or loading state hasn't been set
              oninit: async (vvnode) => {
                // initialize API if needed before starting webwallet
                vnode.state.initializingWallet = true;
                await app.chain.initApi();
                await (app.chain as Substrate || app.chain as Ethereum).webWallet.enable();
                vnode.state.initializingWallet = false;
                m.redraw();
              },
              onclick: async (vvnode) => {
                // initialize API if needed before starting webwallet
                vnode.state.initializingWallet = true;
                await app.chain.initApi();
                await (app.chain as Substrate || app.chain as Ethereum).webWallet.enable();
                vnode.state.initializingWallet = false;
                m.redraw();
              },
              label: vnode.state.initializingWallet !== false
                ? [ m(Spinner, { size: 'xs', active: true }), ' Connecting to chain...' ]
                : (app.chain as Substrate || app.chain as Ethereum).webWallet.available
                  ? 'Connect to wallet' : 'No wallet detected',
            }),
          (app.chain as Substrate || app.chain as Ethereum).webWallet
            && (app.chain as Substrate || app.chain as Ethereum).webWallet.enabled && m('.accounts-caption', [
            (app.chain as Substrate || app.chain as Ethereum).webWallet.accounts.length ? [
              m('p', 'Select an account to link.'),
              m('p.small-text', 'If a popup does not appear, click your browser extension.'),
            ] : [
              m('p', 'Wallet connected, but no accounts were found.'),
            ],
          ]),
          m('.accounts-list', app.chain.networkStatus !== ApiStatus.Connected ? [
            m('.accounts-list-unavailable', 'Must be connected to chain')
          ] : [
            [ChainBase.Ethereum
            ].indexOf(app.chain.base) !== -1 && (app.chain as Ethereum).webWallet.accounts.map(
              (address) => m(EthereumLinkAccountItem, {
                address,
                accountVerifiedCallback,
                errorCallback: (err) => {
                  vnode.state.error = 'Verification failed due to an inconsistency error. '
                    + 'Please report this to the developers.';
                  notifyError(vnode.state.error);
                  m.redraw();
                },
                linkNewAddressModalVnode: vnode,
              })
            ),
            [ChainBase.Substrate
            ].indexOf(app.chain.base) !== -1 && (app.chain as Substrate).webWallet.accounts.map(
              (account: InjectedAccountWithMeta) => m(SubstrateLinkAccountItem, {
                account,
                accountVerifiedCallback,
                errorCallback: (error) => { notifyError(error); vnode.state.error = error; m.redraw(); },
                linkNewAddressModalVnode: vnode,
              })
            ),
          ]),
          vnode.state.error && m('.error-message', vnode.state.error),
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step2VerifyWithCLI ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          app.chain.base === ChainBase.Substrate && [
            m('p.link-address-cli-explainer', [
              'Enter the address you are using. If you need a new address, you can generate one by running:',
            ]),
            vnode.state.error && !vnode.state.newAddress && m('.error-message', vnode.state.error),
            m(CodeBlock, { clickToSelect: true }, [
              vnode.state.isEd25519 ? 'subkey -e generate' : 'subkey generate',
            ]),
          ],
          app.chain.base === ChainBase.CosmosSDK && [
            m('p', [
              'Select an address to add. You can generate one using gaiacli, or choose an existing address ',
              ' by running ',
              m('code', 'gaiacli keys list'),
            ]),
            m(CodeBlock, { clickToSelect: true }, [
              'gaiacli keys add ',
              m('span.no-select', '<name>'),
            ]),
          ],
          app.chain.base === ChainBase.Substrate && m(CheckboxFormField, {
            name: 'is-ed25519',
            label: 'Key is ed25519 format',
            callback: async (result) => {
              vnode.state.isEd25519 = !!result;

              // resubmit creation if they check box after pasting address
              if (!vnode.state.enteredAddress) return;
              if (!vnode.state.error) {
                try {
                  vnode.state.newAddress = await createUserWithAddress(AddressSwapper({
                    address: vnode.state.enteredAddress,
                    currentPrefix: (app.chain as Substrate).chain.ss58Format,
                  }), vnode.state.isEd25519 ? 'ed25519' : undefined);
                } catch (e) {
                  vnode.state.error = e.responseJSON ? e.responseJSON.error : 'Failed to create user.';
                }
              }

              m.redraw();
            },
          }),
          m(Input, {
            name: 'Address',
            placeholder: app.chain.base === ChainBase.Substrate ? 'Paste the address here: 5Dvq...'
              : app.chain.base === ChainBase.CosmosSDK ? 'Paste the address here: cosmos123...'
                : 'Paste the address here',
            onchange: async (e) => {
              const address = (e.target as any).value;
              vnode.state.error = null;
              vnode.state.enteredAddress = address;

              // Prevent validation on empty field
              if (address === '') {
                return;
              }

              if ((app.chain.base === ChainBase.Substrate)) {
                if (isU8a(address) || isHex(address)) {
                  vnode.state.error = 'Address must be SS58 (e.g. 5Ew4...)';
                }
                try {
                  (await import('@polkadot/keyring')).decodeAddress(address);
                } catch (err) {
                  vnode.state.error = 'Invalid address';
                }
                if (app.user.activeAccounts.find((acct) => acct.address === address)) {
                  vnode.state.error = 'You have already linked this address';
                }
              }

              if (!vnode.state.error) {
                try {
                  vnode.state.newAddress = await createUserWithAddress(AddressSwapper({
                    address,
                    currentPrefix: (app.chain as Substrate).chain.ss58Format,
                  }), vnode.state.isEd25519 ? 'ed25519' : undefined);
                } catch (err) {
                  vnode.state.error = err.responseJSON ? err.responseJSON.error : 'Failed to create user.';
                }
              }

              m.redraw();
            },
          }),
          // Allow signing iff address has been created and account has been verified
          vnode.state.newAddress && m('.link-address-cli-verification', [
            app.chain.base === ChainBase.Substrate && [
              m('p', 'Use the secret phrase to sign this message:'),
              m(CodeBlock, { clickToSelect: true }, [
                `echo "${vnode.state.newAddress.validationToken}" | subkey ${vnode.state.isEd25519 ? '-e ' : ''}sign "`,
                m('span.no-select', 'secret phrase'),
                '"',
              ]),
            ],
            app.chain.base === ChainBase.CosmosSDK && m('p', [
              'Use the following command to save the JSON to a file: ',
              m(CodeBlock, { clickToSelect: true }, `echo '${JSON.stringify({
                type: 'cosmos-sdk/StdTx',
                value: vnode.state.cosmosStdTx,
              })}' > tx.json`),
              m('p', 'Sign the saved transaction, using your keys in gaiacli: '),
              m(CodeBlock, { clickToSelect: true }, [
                `gaiacli tx sign --offline --chain-id=${VALIDATION_CHAIN_DATA.chainId} `
                  + `--sequence=${VALIDATION_CHAIN_DATA.sequence} `
                  + `--account-number=${VALIDATION_CHAIN_DATA.accountNumber} --signature-only --from=`,
                m('span.no-select', '<key name> <tx.json>'),
              ]),
            ]),
            m(Input, {
              name: 'Signature',
              placeholder: (app.chain.base === ChainBase.CosmosSDK)
                ? 'Paste the entire output'
                : 'Paste the signature here',
              onchange: async (e) => {
                const signature = (e.target as any).value;
                const unverifiedAcct = vnode.state.newAddress;
                const validationToken = unverifiedAcct.validationToken;
                vnode.state.error = null;
                try {
                  if (await unverifiedAcct.isValidSignature(`${validationToken}\n`, signature)) {
                    vnode.state.validSig = signature;
                  } else {
                    vnode.state.error = 'Invalid signature';
                  }
                } catch (err) {
                  vnode.state.error = 'Invalid signature';
                }
                m.redraw();
              },
            }),
            vnode.state.error && vnode.state.newAddress && m('.error-message', vnode.state.error),
            app.chain.base === ChainBase.Substrate && m(CheckboxFormField, {
              name: 'secret-phrase-saved',
              label: 'My secret phrase is saved somewhere safe',
              callback: (result) => {
                vnode.state.secretPhraseSaved = result;
              },
            }),
            (vnode.state.validSig
             && (app.chain.base !== ChainBase.Substrate || vnode.state.secretPhraseSaved)
            ) ? [
                m('button.formular-button-primary', {
                  onclick: async (e) => {
                    e.preventDefault();
                    const unverifiedAcct: Account<any> = vnode.state.newAddress;
                    unverifiedAcct.validate(vnode.state.validSig).then(() => {
                    // if no exception was raised, account must be valid
                      accountVerifiedCallback(app.chain.accounts.get(unverifiedAcct.address), vnode);
                    }, (err) => {
                      vnode.state.error = 'Verification failed. There was an inconsistency error; '
                      + 'please report this to the developers.';
                      m.redraw();
                    });
                  }
                }, 'Continue'),
              ] : [
                m('button.disabled', {
                  onclick: (e) => {
                    e.preventDefault();
                  }
                }, 'Continue'),
              ],
          ]),
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step2VerifyWithHedgehog ? m('.link-address-step', [
        m('.link-address-step-header', [
          m('h3', 'Log in with username and password'),
        ]),
        m('.link-address-step-narrow', [
          m(HedgehogLoginForm, { accountVerifiedCallback, linkNewAddressModalVnode: vnode }),
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step3CreateProfile ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          m('.create-profile-instructions', vnode.state.isNewLogin
            ? 'Logged in! Now create a profile:'
            : 'Address verified! Now create a profile:'),
          m('.new-account-userblock', [
            m(UserBlock, { user: vnode.state.newAddress }),
          ]),
          m('.avatar-wrap', [
            m(AvatarUpload, {
              uploadStartedCallback: () => {
                vnode.state.uploadsInProgress = true;
                m.redraw();
              },
              uploadCompleteCallback: (files) => {
                vnode.state.uploadsInProgress = false;
                // TODO: upload URL
                files.forEach((f) => {
                  if (!f.uploadURL) return;
                  const url = f.uploadURL.replace(/\?.*/, '');
                  $('.LinkNewAddressModal').find('input[name=avatarUrl]').val(url.trim());
                });
                m.redraw();
              },
            }),
          ]),
          m(Input, {
            title: 'Name',
            name: 'name',
            placeholder: 'Name',
            fluid: true,
            autocomplete: 'off',
            oncreate: (vvnode) => {
              // prefill preexisting name, or default name
              if (vnode.state.newAddress && vnode.state.newAddress.profile && vnode.state.newAddress.profile.name) {
                $(vvnode.dom).find('input[type="text"]').val(vnode.state.newAddress.profile.name);
                vnode.state.hasName = true;
                m.redraw();
              } else if (vnode.state.newAddress.chain.network === 'near') {
                $(vvnode.dom).find('input[type="text"]').val(vnode.state.newAddress.address);
                vnode.state.hasName = true;
                m.redraw();
              }
            },
            onkeyup: (e) => {
              vnode.state.hasName = !!e.target.value;
            },
          }),
          m(Input, {
            title: 'Headline',
            name: 'headline',
            placeholder: 'Headline (optional)',
            fluid: true,
            autocomplete: 'off',
            oncreate: (vvnode) => {
              // prefile preexisting headline
              if (vnode.state.newAddress && vnode.state.newAddress.profile) {
                $(vvnode.dom).find('input[type="text"]').val(vnode.state.newAddress.profile.headline);
              }
              $(vvnode.dom).trigger('keyup');
            },
            onkeyup: (e) => {
              vnode.state.hasHeadline = !!e.target.value;
            },
          }),
          m('input', {
            type: 'hidden',
            name: 'avatarUrl',
          }),
          m(TextArea, {
            class: 'new-profile-bio',
            name: 'bio',
            placeholder: 'Short Bio (optional)',
            fluid: true,
            oncreate: (vvnode) => {
              if (vnode.state.newAddress && vnode.state.newAddress.profile)
                $(vvnode.dom).val(vnode.state.newAddress.profile.bio);
            },
          }),
          vnode.state.error && m('.error-message', [
            vnode.state.error,
            m('br'),
            'Try again?',
          ]),
          m(Button, {
            intent: 'primary',
            disabled: (vnode.state.uploadsInProgress || !vnode.state.hasName),
            onclick: async (e) => {
              e.preventDefault();
              const $form = $('.LinkNewAddressModal');
              const data = {
                name: `${$form.find('input[name=name]').val()}`,
                headline: `${$form.find('input[name=headline]').val()}`,
                bio: `${$form.find('textarea[name=bio]').val()}`,
                avatarUrl: `${$form.find('input[name=avatarUrl]').val()}`,
              };
              app.profiles.updateProfileForAccount(vnode.state.newAddress, data).then((args) => {
                vnode.state.error = null;
                $form.trigger('modalforceexit');
                if (vnode.attrs.successCallback) vnode.attrs.successCallback();
                m.redraw();
              }).catch((err) => {
                vnode.state.error = err.responseJSON ? err.responseJSON.error : 'Unable to create profile';
                m.redraw();
              });
            },
            label: 'Save and finish'
          }),
        ]),
      ]) : m('.link-address-step', [
        m('.link-address-step-header', [
          m('h3', 'Error'),
        ]),
        m('.link-address-step-narrow', [
          m('p', [
            m('a', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                vnode.state.step = LinkNewAddressSteps.Step1SelectWallet;
              }
            }, 'Start over'),
          ]),
        ]),
      ]),
    ]);
  }
};

// inject confirmExit property
LinkNewAddressModal['confirmExit'] = confirmationModalWithText(
  app.isLoggedIn() ? 'Cancel out of linking address?' : 'Cancel out of logging in?'
);

export default LinkNewAddressModal;
