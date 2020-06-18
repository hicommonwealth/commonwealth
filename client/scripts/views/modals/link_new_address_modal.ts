import 'modals/link_new_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { isU8a, isHex, stringToHex } from '@polkadot/util';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { SignerPayloadRaw } from '@polkadot/types/types/extrinsic';

import { initAppState } from 'app';
import app, { ApiStatus } from 'state';
import { keyToMsgSend, VALIDATION_CHAIN_DATA } from 'adapters/chain/cosmos/keys';
import { updateActiveAddresses, createUserWithAddress, setActiveAccount } from 'controllers/app/login';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import Substrate from 'controllers/chain/substrate/main';
import Ethereum from 'controllers/chain/ethereum/main';
import Near from 'controllers/chain/near/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { EthereumAccount } from 'controllers/chain/ethereum/account';
import { Account, ChainBase, ChainNetwork } from 'models';

import { ChainIcon } from 'views/components/chain_icon';
import CodeBlock from 'views/components/widgets/code_block';
import { TextInputFormField, CheckboxFormField } from 'views/components/forms';
import HedgehogLoginForm from 'views/components/hedgehog_login_form';
import CharacterLimitedTextInput from 'views/components/widgets/character_limited_text_input';
import ResizableTextarea from 'views/components/widgets/resizable_textarea';
import User, { UserBlock } from 'views/components/widgets/user';
import AvatarUpload from 'views/components/avatar_upload';
import SubstrateChain from 'client/scripts/controllers/chain/substrate/shared';
import AddressSwapper from '../components/addresses/address_swapper';

enum LinkNewAddressSteps {
  Step1SelectWallet,
  Step2VerifyWithCLI,
  Step2VerifyWithWebWallet,
  Step2VerifyWithHedgehog,
  Step3CreateProfile,
  Step4Complete,
}

enum LinkNewAddressWallets {
  Metamask,
  PolkadotJS,
  NEARWallet,
  CLIWallet,
  Hedgehog,
}

interface ILinkNewAddressAttrs {
  loggingInWithAddress?: boolean; // determines whether the header says "Link new address" or "Login with address"
  alreadyInitializedAccount?: Account<any>; // skips the verification steps, and goes straight to profile creation
}

interface ILinkNewAddressState {
  // meta
  step;
  error;
  // step 1 - select a wallet, then press continue
  selectedWallet: LinkNewAddressWallets;
  // step 2 - enter a new address, then validate a signature with the address
  validSig: string;
  secretPhraseSaved: boolean;
  newAddress: Account<any>; // true if account was already initialized, otherwise it's the Account
  // step 3 - create a profile
  isNewLogin: boolean;
  // step 4 - complete
  hasName: boolean;
  hasHeadline: boolean;
  uploadsInProgress: boolean;
  isEd25519?: boolean;
  enteredAddress?: string;
  cosmosStdTx?: object;
}

// Set to false when completing the NEAR flow
let canExit = true;

// Step 2 -> Step 3
const accountVerifiedCallback = async (account, vnode) => {
  if (app.isLoggedIn()) {
    // existing user
    setActiveAccount(account, true);
    vnode.state.newAddress = account;
    vnode.state.step = LinkNewAddressSteps.Step3CreateProfile;
    vnode.state.error = null;
    canExit = true;
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
    $(vnode.dom).trigger('modalexit');
  } else {
    // log in as the new user
    await initAppState(false);
    // load addresses for the current chain/community
    if (app.community) {
      updateActiveAddresses(undefined, true);
    } else if (app.chain) {
      const chain = app.login.selectedNode
        ? app.login.selectedNode.chain
        : app.config.nodes.getByChain(app.activeChainId())[0].chain;
      updateActiveAddresses(chain, true);
    } else {
      notifyError('Signed in, but no chain or community found');
    }
    // if we're logging in and have a profile, we can just close out the modal
    if (account.profile && account.profile.initialized && account.profile.name) {
      $(vnode.dom).trigger('modalexit');
      notifySuccess('Logged in');
    } else {
      vnode.state.step = LinkNewAddressSteps.Step3CreateProfile;
      canExit = false;
    }
    vnode.state.newAddress = account;
    vnode.state.isNewLogin = true;
    vnode.state.error = null;
    m.redraw();
  }
};

const SubstrateLinkAccountItem: m.Component<{ account, accountVerifiedCallback, errorCallback, parentVnode }, { linking }> = {
  view: (vnode) => {
    const { account, accountVerifiedCallback, errorCallback } = vnode.attrs;
    return m('.SubstrateLinkAccountItem.account-item', {
      onclick: async (e) => {
        e.preventDefault();
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
          return errorCallback('Verification failed.');
        }
        signerAccount.validate(signature).then(() => {
          vnode.state.linking = false;
          accountVerifiedCallback(signerAccount, vnode.attrs.parentVnode);
        }, (err) => {
          vnode.state.linking = false;
          errorCallback('Verification failed.');
        });
      }
    }, vnode.state.linking ? [
      m('.account-waiting', 'Waiting for signature...'),
    ] : [
      m('.account-name', account.meta.name),
      m('.account-user', [
        m(User, { user: app.chain.accounts.get(account.address) }),
      ]),
    ]);
  }
};

const LinkNewAddressModal = {
  confirmExit: () => {
    return canExit;
  },
  view: (vnode: m.VnodeDOM<ILinkNewAddressAttrs, ILinkNewAddressState>) => {
    if (!app.chain) {
      // show chain selector modal
      const chains = {};
      app.config.nodes.getAll().forEach((n) => {
        chains[n.chain.network] ? chains[n.chain.network].push(n) : chains[n.chain.network] = [n];
      });

      return m('.LinkNewAddressModal', [
        m('.link-address-step', [
          m('.link-address-step-header', [
            m('h3', 'Select a network')
          ]),
          m('.chains', [
            Object.entries(chains).map(([chain, nodeList] : [string, any]) => m('.chain-card', {
              class: (nodeList[0].chain.network === ChainNetwork.Cosmos
                      || nodeList[0].chain.network === ChainNetwork.Edgeware
                      || nodeList[0].chain.network === ChainNetwork.Kusama) ? 'hidden-mobile' : '',
              onclick: async (e) => {
                e.preventDefault();
                // Overwrite the current path to force a switch to another chain.
                if (app.chain) {
                  m.route.set(`/${chains[chain][0].chain.id}/web3login`, {}, { replace: true });
                } else {
                  m.route.set(`/${chains[chain][0].chain.id}/web3login`);
                }
              }
            }, [
              m(ChainIcon, { chain: nodeList[0].chain }),
              m('.chain-info', [
                m('h3', chain.charAt(0).toUpperCase() + chain.substring(1)),
                m('p', [
                  nodeList[0].chain.network === ChainNetwork.NEAR ? 'Hosted wallet at nearprotocol.com'
                    : nodeList[0].chain.network === ChainNetwork.Ethereum ? 'Browser extension or password'
                      : nodeList[0].chain.network === ChainNetwork.Cosmos ? 'Command line only'
                        : 'Command line or browser extension'
                ]),
              ]),
            ])),
            m('.clear'),
          ]),
        ]),
      ]);
    }

    if (vnode.state.step === undefined) {
      if (vnode.attrs.alreadyInitializedAccount) {
        vnode.state.step = LinkNewAddressSteps.Step3CreateProfile;
        vnode.state.newAddress = vnode.attrs.alreadyInitializedAccount;
        canExit = false;
      } else {
        vnode.state.step = LinkNewAddressSteps.Step1SelectWallet;
      }
    }

    const linkAddressHeader = m('.link-address-step-header', [
      vnode.attrs.loggingInWithAddress
        ? m('h3', `Log in with ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} wallet`)
        : m('h3', `New ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`),
    ]);

    const isMobile = $(window).width() <= 440;

    // TODO: hack to fix linking now that keyToMsgSend is async
    if (vnode.state.newAddress) {
      keyToMsgSend(
        vnode.state.newAddress.address,
        vnode.state.newAddress.validationToken,
      ).then((stdTx) => vnode.state.cosmosStdTx = stdTx);
    }

    return m('.LinkNewAddressModal', [
      vnode.state.step === LinkNewAddressSteps.Step1SelectWallet ? m('.link-address-step', [
        linkAddressHeader,
        vnode.state.error && m('.error-message', vnode.state.error),
        m('p.link-address-precopy', vnode.attrs.loggingInWithAddress ? [
          'Select a wallet:'
        ] : app.login.activeAddresses.length === 0 ? [
          'Select a wallet:'
        ] : [
          m('.link-address-combined-warning', [
            m('.link-address-combined-warning-icon', '⚠️'),
            m('.link-address-combined-warning-text', [
              'Anyone with the private keys for this address will be able to log into your Commonwealth account.'
            ]),
          ]),
          'Select a wallet:'
        ]),
        // wallet options
        m('.link-address-options', [
          // mobile error message -- if not Ethereum or NEAR
          isMobile && app.chain.base !== ChainBase.Ethereum && app.chain.base !== ChainBase.NEAR
            && m('.mobile-error-message', [
              m('p', 'No mobile wallet available.'),
              m('p', 'Link an address on desktop first.'),
            ]),
          // browser extension -- for Substrate chains
          !isMobile && app.chain.base === ChainBase.Substrate && m('.link-address-option', {
            class: (vnode.state.selectedWallet === LinkNewAddressWallets.PolkadotJS ? 'selected ' : ' ')
              + (((app.chain as Substrate).webWallet && (app.chain as Substrate).webWallet.available) ? '' : 'disabled'),
            onclick: (e) => {
              vnode.state.selectedWallet = LinkNewAddressWallets.PolkadotJS;
              $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
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
              $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
            }
          }, [
            m('.link-address-option-inner', [
              m('.link-address-header', [
                m('.link-address-icon', [
                  m('img', { src: '/static/img/metamask.png' }),
                ]),
                m('.link-address-title', 'Metamask'),
              ]),
              m('.link-address-description', [
                `Use a Metamask-compatible ${isMobile ? 'mobile app' : 'browser extension'}`,
              ]),
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
          !isMobile && [ChainBase.CosmosSDK, ChainBase.Substrate
          ].indexOf(app.chain.base) !== -1 && m('.link-address-option', {
            class: (vnode.state.selectedWallet === LinkNewAddressWallets.CLIWallet ? 'selected' : ''),
            onclick: (e) => {
              vnode.state.selectedWallet = LinkNewAddressWallets.CLIWallet;
              $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
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
              // $(e.target).closest('.link-address-options').next('button.link-address-options-continue').click();
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
        m('button.link-address-options-continue.formular-button-primary', {
          class: vnode.state.selectedWallet === undefined ? 'disabled'
            : (vnode.state.selectedWallet === LinkNewAddressWallets.PolkadotJS
             && !((app.chain as Substrate).webWallet && (app.chain as Substrate).webWallet.available)) ? 'disabled'
              : (vnode.state.selectedWallet === LinkNewAddressWallets.Metamask
             && !((app.chain as Ethereum).webWallet && (app.chain as Ethereum).webWallet.available)) ? 'disabled' : '',
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
          }
        }, vnode.state.selectedWallet === undefined ? 'Select a wallet'
          : (vnode.state.selectedWallet === LinkNewAddressWallets.PolkadotJS
           && !((app.chain as Substrate).webWallet && (app.chain as Substrate).webWallet.available)) ? 'Wallet not found'
            : (vnode.state.selectedWallet === LinkNewAddressWallets.Metamask
           && !((app.chain as Ethereum).webWallet && (app.chain as Ethereum).webWallet.available)) ? 'Wallet not found'
              : 'Continue'),
        m.route.get().endsWith('/web3login') && m('.link-address-options-back', [
          m('a.back-text', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              window.history.back();
            }
          }, 'Back'),
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step2VerifyWithWebWallet ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          (app.chain as Substrate || app.chain as Ethereum).webWallet
            && (app.chain as Substrate || app.chain as Ethereum).webWallet.accounts
            && (app.chain as Substrate || app.chain as Ethereum).webWallet.accounts.length === 0 && [
            m('button.account-adder', {
              type: 'submit',
              class: (app.chain as Substrate || app.chain as Ethereum).webWallet.available ? '' : 'disabled',
              oncreate: (e) => {
                (app.chain as Substrate || app.chain as Ethereum).webWallet.enable().then(() => m.redraw());
              },
              onclick: (e) => {
                (app.chain as Substrate || app.chain as Ethereum).webWallet.enable().then(() => m.redraw());
              }
            }, [
              (app.chain as Substrate || app.chain as Ethereum).webWallet.available
                ? 'Connect to extension' : 'No extension detected',
            ]),
          ],
          (app.chain as Substrate || app.chain as Ethereum).webWallet
            && (app.chain as Substrate || app.chain as Ethereum).webWallet.enabled && m('.accounts-caption', [
            (app.chain as Substrate || app.chain as Ethereum).webWallet.accounts.length ? [
              m('p', 'Wallet connected! Select an account to link.'),
              m('p.small-text', 'If a popup does not appear, click your browser extension.'),
            ] : [
              m('p', 'Wallet connected, but no accounts were found.'),
            ],
          ]),
          m('.accounts-list', app.chain.networkStatus !== ApiStatus.Connected ? [
            m('.accounts-list-unavailable', 'Must be connected to chain')
          ] : [
            [ChainBase.Ethereum
            ].indexOf(app.chain.base) !== -1 && (app.chain as Ethereum).webWallet.accounts.map((address) => m('.account-item', {
              onclick: async (e) => {
                e.preventDefault();
                const api = (app.chain as Ethereum);
                const webWallet = api.webWallet;

                // Sign with the method on eth_webwallet, because we don't have access to the private key
                const signerAccount = await createUserWithAddress(address) as EthereumAccount;
                const webWalletSignature = await webWallet.signMessage(signerAccount.validationToken);

                signerAccount.validate(webWalletSignature).then(() => {
                  return accountVerifiedCallback(signerAccount, vnode);
                })
                  .then(() => m.redraw())
                  .catch((err) => {
                    vnode.state.error = 'Verification failed. There was an inconsistency error; '
                  + 'please report this to the developers.';
                    m.redraw();
                  });
              },
            }, [
              m('.account-user', [
                m(User, { user: app.chain.accounts.get(address) }),
              ]),
            ])),
            [ChainBase.Substrate
            ].indexOf(app.chain.base) !== -1 && (app.chain as Substrate).webWallet.accounts.map(
              (account: InjectedAccountWithMeta) => m(SubstrateLinkAccountItem, {
                account,
                accountVerifiedCallback,
                errorCallback: (error) => { vnode.state.error = error; m.redraw(); },
                parentVnode: vnode,
              })
            ),
          ]),
          vnode.state.error && m('.error-message', vnode.state.error),
          m('a.back-text', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              vnode.state.step = LinkNewAddressSteps.Step1SelectWallet;
              vnode.state.error = null;
            }
          }, 'Back'),
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
          m(TextInputFormField, {
            options: {
              name: 'Address',
              placeholder: app.chain.base === ChainBase.Substrate ? 'Paste the address here: 5Dvq...'
                : app.chain.base === ChainBase.CosmosSDK ? 'Paste the address here: cosmos123...'
                  : 'Paste the address here',
            },
            callback: async (address) => {
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
                } catch (e) {
                  vnode.state.error = 'Invalid address';
                }
                if (app.login.activeAddresses.find((acct) => acct.address === address)) {
                  vnode.state.error = 'You have already linked this address';
                }
              }

              if (!vnode.state.error) {
                try {
                  vnode.state.newAddress = await createUserWithAddress(AddressSwapper({
                    address,
                    currentPrefix: (app.chain as Substrate).chain.ss58Format,
                  }), vnode.state.isEd25519 ? 'ed25519' : undefined);
                } catch (e) {
                  vnode.state.error = e.responseJSON ? e.responseJSON.error : 'Failed to create user.';
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
                `gaiacli tx sign --offline --chain-id=${VALIDATION_CHAIN_DATA.chainId} --sequence=${VALIDATION_CHAIN_DATA.sequence} --account-number=${VALIDATION_CHAIN_DATA.accountNumber} --signature-only --from=`,
                m('span.no-select', '<key name> <tx.json>'),
              ]),
            ]),
            m(TextInputFormField, {
              options: {
                name: 'Signature',
                placeholder: (app.chain.base === ChainBase.CosmosSDK) ? 'Paste the entire output' : 'Paste the signature here',
              },
              callback: async (signature) => {
                const unverifiedAcct = vnode.state.newAddress;
                const validationToken = unverifiedAcct.validationToken;
                vnode.state.error = null;
                try {
                  if (await unverifiedAcct.isValidSignature(`${validationToken}\n`, signature)) {
                    vnode.state.validSig = signature;
                  } else {
                    vnode.state.error = 'Invalid signature';
                  }
                } catch (e) {
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
          m('a.back-text', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              vnode.state.step = LinkNewAddressSteps.Step1SelectWallet;
              vnode.state.error = null;
            }
          }, 'Back'),
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step2VerifyWithHedgehog ? m('.link-address-step', [
        m('.link-address-step-header', [
          m('h3', 'Log in with username and password'),
        ]),
        m('.link-address-step-narrow', [
          m(HedgehogLoginForm, { accountVerifiedCallback, parentVnode: vnode }),
          m('br'),
          m('a.back-text', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              vnode.state.step = LinkNewAddressSteps.Step1SelectWallet;
            }
          }, 'Back'),
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step3CreateProfile ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          m('.create-profile-instructions', vnode.state.isNewLogin
            ? 'Logged in! Now, create a profile:'
            : 'Address verified! Now, create a profile:'),
          m('.avatar-wrap', [
            m(AvatarUpload, {
              uploadStartedCallback: () => {
                vnode.state.uploadsInProgress = true;
                m.redraw();
              },
              uploadCompleteCallback: (files) => {
                vnode.state.uploadsInProgress = false;
                // TODO: upload URL
                files.map((f) => {
                  if (!f.uploadURL) return;
                  const url = f.uploadURL.replace(/\?.*/, '');
                  $(vnode.dom).find('input[name=avatarUrl]').val(url.trim());
                });
                m.redraw();
              },
            }),
          ]),
          m(CharacterLimitedTextInput, {
            title: 'Name',
            name: 'name',
            placeholder: 'Name',
            limit: 40,
            oncreate: (vnode2) => {
              // prefill preexisting name, or default name
              if (vnode.state.newAddress && vnode.state.newAddress.profile && vnode.state.newAddress.profile.name) {
                $(vnode2.dom).find('input[type="text"]').val(vnode.state.newAddress.profile.name);
                vnode.state.hasName = true;
                m.redraw();
              } else if (vnode.state.newAddress.chain.network === 'near') {
                $(vnode2.dom).find('input[type="text"]').val(vnode.state.newAddress.address);
                vnode.state.hasName = true;
                m.redraw();
              }
            },
            onkeyup: (e) => vnode.state.hasName = !!e.target.value,
          }),
          m(CharacterLimitedTextInput, {
            title: 'Headline',
            name: 'headline',
            placeholder: 'Headline (optional)',
            limit: 80,
            oncreate: (vnode2) => {
              // prefile preexisting headline
              if (vnode.state.newAddress && vnode.state.newAddress.profile) {
                $(vnode2.dom).find('input[type="text"]').val(vnode.state.newAddress.profile.headline);
              }
              $(vnode2.dom).trigger('keyup');
            },
            onkeyup: (e) => vnode.state.hasHeadline = !!e.target.value,
          }),
          m('input', {
            type: 'hidden',
            name: 'avatarUrl',
          }),
          m(ResizableTextarea, {
            class: 'new-profile-bio',
            name: 'bio',
            placeholder: 'Short Bio (optional)',
            oncreate: (vnode2) => {
              if (vnode.state.newAddress && vnode.state.newAddress.profile)
                $(vnode2.dom).val(vnode.state.newAddress.profile.bio);
            },
          }),
          m('.error-message', vnode.state.error),
          vnode.state.uploadsInProgress || !vnode.state.hasName ? [
            m('button.formular-button-primary.disabled', 'Save profile to continue'),
          ] : [
            m('button.formular-button-primary', {
              onclick: async (e) => {
                e.preventDefault();
                const data = {
                  name: `${$(vnode.dom).find('input[name=name]').val()}`,
                  headline: `${$(vnode.dom).find('input[name=headline]').val()}`,
                  bio: `${$(vnode.dom).find('textarea[name=bio]').val()}`,
                  avatarUrl: `${$(vnode.dom).find('input[name=avatarUrl]').val()}`,
                };
                app.profiles.updateProfileForAccount(vnode.state.newAddress, data).then((args) => {
                  vnode.state.step = LinkNewAddressSteps.Step4Complete;
                  vnode.state.error = null;
                  $(vnode.dom).trigger('modalcomplete');
                  m.redraw();
                }).catch((e) => {
                  vnode.state.error = e.responseJSON ? e.responseJSON.error : 'Unable to create profile';
                  m.redraw();
                });
              }
            }, 'Save profile to continue'),
          ],
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step4Complete ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          m('p', vnode.state.isNewLogin ? 'Logged in:' : 'Profile created:'),
          m('.profile-block-preview', [
            vnode.state.newAddress
              ? m(UserBlock, { user: vnode.state.newAddress })
              : m('.error-message', 'There was an issue fetching your new account'),
          ]),
          m('br'),
          m('button.btn-finished-action', {
            onclick: (e) => {
              canExit = true;
              e.preventDefault();
              $(vnode.dom).trigger('modalexit');
            }
          }, 'Close'),
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

export default LinkNewAddressModal;
