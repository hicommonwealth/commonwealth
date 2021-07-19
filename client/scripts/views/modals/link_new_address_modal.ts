import 'modals/link_new_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { isU8a, isHex } from '@polkadot/util';

import { Button, Input, TextArea, Spinner, Checkbox } from 'construct-ui';

import { initAppState } from 'app';
import { isSameAccount, link } from 'helpers';
import { AddressInfo, Account, ChainBase, IWebWallet } from 'models';
import app, { ApiStatus } from 'state';

import { updateActiveAddresses, createUserWithAddress, setActiveAccount } from 'controllers/app/login';
import { notifyError, notifyInfo } from 'controllers/app/notifications';
import Substrate from 'controllers/chain/substrate/main';
import Near from 'controllers/chain/near/main';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import CodeBlock from 'views/components/widgets/code_block';
import User from 'views/components/widgets/user';
import AvatarUpload from 'views/components/avatar_upload';
import AddressSwapper from 'views/components/addresses/address_swapper';

enum LinkNewAddressSteps {
  Step1VerifyWithCLI,
  Step1VerifyWithWebWallet,
  Step2CreateProfile,
}

enum LinkNewAddressWallets {
  Metamask,
  PolkadotJS,
  NEARWallet,
  CLIWallet,
}

const LinkAccountItem: m.Component<{
  account: { address: string, meta?: { name: string } },
  targetCommunity: string,
  accountVerifiedCallback: (account: Account<any>) => Promise<void>,
  errorCallback: (error: string) => void,
  linkNewAddressModalVnode: m.Vnode<ILinkNewAddressModalAttrs, ILinkNewAddressModalState>,
  base: ChainBase,
  webWallet: IWebWallet<any>,
}, { linking: boolean }> = {
  view: (vnode) => {
    const {
      account,
      accountVerifiedCallback,
      errorCallback,
      linkNewAddressModalVnode,
      targetCommunity,
      base,
      webWallet,
    } = vnode.attrs;
    const address = base === ChainBase.Substrate
      ? AddressSwapper({
        address: account.address,
        currentPrefix: (app.chain as Substrate).chain.ss58Format,
      })
      : account.address;
    const isPrepopulated = account.address === linkNewAddressModalVnode.attrs.prepopulateAddress
      || address === linkNewAddressModalVnode.attrs.prepopulateAddress;
    const name = account.meta?.name || (base === ChainBase.CosmosSDK
      ? `${app.chain.meta.chain.name} address ${account.address.slice(0, 6)}...`
      : `Ethereum address ${account.address.slice(0, 6)}...`);
    return m('.LinkAccountItem.account-item', {
      class: `${isPrepopulated ? 'account-item-emphasized' : ''} ${vnode.state.linking ? 'account-item-disabled' : ''}`,
      onclick: async (e) => {
        e.preventDefault();
        if (vnode.state.linking) return;

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
          if (linkNewAddressModalVnode.state.linkingComplete) return;
          linkNewAddressModalVnode.state.linkingComplete = true;
          accountVerifiedCallback(signerAccount);
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
        m('.account-item-name', `${name}`),
        m('.account-item-address', [
          m('.account-user', m(User, { user: app.chain.accounts.get(address), hideAvatar: true })),
        ]),
        vnode.state.linking
          && m('p.small-text', 'Check your wallet for a confirmation prompt.')
      ]),
      m('.account-item-right', [
        vnode.state.linking && m('.account-waiting', [
          // TODO: show a (?) icon with a tooltip explaining to check your wallet
          m(Spinner, { size: 'xs', active: true })
        ])
      ]),
    ]);
  }
};

interface ILinkNewAddressModalAttrs {
  loggingInWithAddress?: boolean; // determines whether the header says "Connect address" or "Login with address"
  joiningCommunity: string,       // join community after verification
  joiningChain: string,           // join chain after verification
  targetCommunity?: string,       // valid when loggingInWithAddress=true and user joins community thru default chain.
  useCommandLineWallet: boolean,  //
  webWallet?: IWebWallet<any>,
  alreadyInitializedAccount?: Account<any>; // skip verification, go straight to profile creation (only used for NEAR)
  prepopulateAddress?: string, // link a specific address rather than prompting
  successCallback;
}

interface ILinkNewAddressModalState {
  // meta
  step;
  error;
  selectedWallet: LinkNewAddressWallets;
  isFirstInit: boolean,
  // step 1 - validate address
  userProvidedSignature: string;
  secretPhraseSaved: boolean;
  newAddress: Account<any>; // true if account was already initialized, otherwise it's the Account
  linkingComplete: boolean;
  // step 2 - create a profile
  isNewLogin: boolean;
  // step 3 - complete
  hasName: boolean;
  hasHeadline: boolean;
  uploadsInProgress: boolean;
  isEd25519?: boolean;
  enteredAddress?: string;
  initializingWallet: boolean;
  onpopstate;
}

const LinkNewAddressModal: m.Component<ILinkNewAddressModalAttrs, ILinkNewAddressModalState> = {
  // close the modal if the user moves away from the page
  oncreate: (vnode) => {
    vnode.state.onpopstate = (e) => {
      $('.LinkNewAddressModal').trigger('modalforceexit');
    };
    $(window).on('popstate', vnode.state.onpopstate);
    vnode.state.isFirstInit = true;
  },
  onremove: (vnode) => {
    $(window).off('popstate', vnode.state.onpopstate);
  },
  view: (vnode) => {
    const linkAddressHeader = m('.compact-modal-title', [
      vnode.attrs.loggingInWithAddress ? m('h3', 'Log in with address') : m('h3', 'Connect address'),
    ]);

    const { targetCommunity } = vnode.attrs;

    // initialize the step
    if (vnode.state.step === undefined) {
      if (vnode.attrs.alreadyInitializedAccount) {
        vnode.state.step = LinkNewAddressSteps.Step2CreateProfile;
        vnode.state.newAddress = vnode.attrs.alreadyInitializedAccount;
      } else {
        vnode.state.step = vnode.attrs.useCommandLineWallet
          ? LinkNewAddressSteps.Step1VerifyWithCLI
          : LinkNewAddressSteps.Step1VerifyWithWebWallet;
      }
    }

    // TODO: refactor this out so we don't have duplicated loading code
    if (!app.chain && vnode.state.step !== LinkNewAddressSteps.Step2CreateProfile) return m('.LinkNewAddressModal', {
      key: 'placeholder', // prevent vnode from being reused so later oninit / oncreate code runs
    }, [
      m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          m(Button, {
            class: 'account-adder-placeholder',
            key: 'placeholder',
            intent: 'primary',
            label: [ m(Spinner, { size: 'xs', active: true }), ' Connecting to chain...' ],
            rounded: true,
            disabled: true,
          }),
        ])
      ])
    ]);

    // TODO: add a step to help users install wallets
    // gaiacli 'https://cosmos.network/docs/cosmos-hub/installation.html',
    // subkey 'https://substrate.dev/docs/en/ecosystem/subkey'
    // polkadot-js 'https://github.com/polkadot-js/extension'

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
              await app.user.createRole({
                address: addressInfo,
                chain: vnode.attrs.joiningChain,
              });
            } else if (vnode.attrs.joiningCommunity
                       && !app.user.getRoleInCommunity({ account, community: vnode.attrs.joiningCommunity })) {
              await app.user.createRole({ address: addressInfo, community: vnode.attrs.joiningCommunity });
            }
          } catch (e) {
            // this may fail if the role already exists, e.g. if the address is being migrated from another user
            console.error('Failed to create role');
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

        vnode.state.newAddress = account;
        vnode.state.step = LinkNewAddressSteps.Step2CreateProfile;
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
        $('.LinkNewAddressModal').trigger('modalforceexit');
        if (vnode.attrs.successCallback) vnode.attrs.successCallback();
        m.redraw();
      } else {
        // log in as the new user
        await initAppState(false);
        // load addresses for the current chain/community
        if (app.community) {
          await updateActiveAddresses();
        } else if (app.chain) {
          // TODO: this breaks when the user action creates a new token forum
          const chain = app.user.selectedNode
            ? app.user.selectedNode.chain
            : app.config.nodes.getByChain(app.activeChainId())[0].chain;
          await updateActiveAddresses(chain);
        } else {
          notifyError('Signed in, but no chain or community found');
        }
        // if we're logging in and have a profile, we can just close out the modal
        if (account.profile && account.profile.initialized && account.profile.name) {
          $('.LinkNewAddressModal').trigger('modalforceexit');
          if (vnode.attrs.successCallback) vnode.attrs.successCallback();
        } else {
          vnode.state.step = LinkNewAddressSteps.Step2CreateProfile;
        }
        vnode.state.newAddress = account;
        vnode.state.isNewLogin = true;
        vnode.state.error = null;
        m.redraw();
      }
    };

    const cliAddressInputFn = async (address) => {
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
      }
      if (app.user.activeAccounts.find((acct) => acct.address === address)) {
        vnode.state.error = 'You have already linked this address';
      }

      if (!vnode.state.error) {
        try {
          vnode.state.newAddress = await createUserWithAddress(address, vnode.state.isEd25519 ? 'ed25519' : undefined, targetCommunity);
        } catch (err) {
          vnode.state.error = err.responseJSON ? err.responseJSON.error : 'Failed to create user.';
        }
      }

      m.redraw();
    };

    // immediately trigger address population if given
    if (vnode.attrs.prepopulateAddress && vnode.state.isFirstInit) {
      vnode.state.isFirstInit = false;
      cliAddressInputFn(vnode.attrs.prepopulateAddress);
    }

    const webWallet = vnode.attrs.webWallet;
    return m('.LinkNewAddressModal', [
      vnode.state.step === LinkNewAddressSteps.Step1VerifyWithWebWallet ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          webWallet?.accounts?.length === 0
            && m(Button, {
              class: 'account-adder',
              intent: 'primary',
              rounded: true,
              disabled: !webWallet?.available // disable if unavailable
                || vnode.state.initializingWallet !== false, // disable if loading, or loading state hasn't been set
              oncreate: async (vvnode) => {
                // initialize API if needed before starting webwallet
                // avoid oninit because it may be called multiple times
                if (vnode.state.initializingWallet) return;
                vnode.state.initializingWallet = true;
                if (!webWallet.enabling && !webWallet.enabled) {
                  await webWallet?.enable();
                }
                // TODO: this check can have race conditions -- need "initializing"
                if (!app.chain.apiInitialized) {
                  await app.chain.initApi();
                }
                vnode.state.initializingWallet = false;
                m.redraw();
              },
              onclick: async (vvnode) => {
                // initialize API if needed before starting webwallet
                if (vnode.state.initializingWallet) return;
                vnode.state.initializingWallet = true;
                if (!webWallet.enabling && !webWallet.enabled) {
                  await webWallet?.enable();
                }
                // TODO: this check can have race conditions -- need "initializing"
                if (!app.chain.apiInitialized) {
                  await app.chain.initApi();
                }
                vnode.state.initializingWallet = false;
                m.redraw();
              },
              label:
                !webWallet?.available
                  ? 'No wallet detected'
                  : (vnode.state.initializingWallet !== false && app.chain.networkStatus !== ApiStatus.Disconnected)
                    ? [ m(Spinner, { size: 'xs', active: true }), ' Connecting to chain...' ]
                    : app.chain.networkStatus === ApiStatus.Disconnected
                      ? [ m(Spinner, { size: 'xs', active: true }), ' Connecting to chain...' ]
                      : 'Connect to wallet'
            }),
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
            webWallet?.accounts.length === 0 ? [
              m('p', 'Wallet connected, but no accounts were found.'),
            ] : webWallet.chain === ChainBase.Ethereum ? [ // metamask + walletconnect
              m('p.small-text', 'Use your wallet to switch between accounts.'),
            ] : [
              m('p', 'Select an address:'),
              m('p.small-text', 'Look for a popup, or check your wallet/browser extension.'),
              webWallet.chain === ChainBase.CosmosSDK // keplr wallet
                && m('p.small-text', [
                  `Because ${app.chain.meta.chain.name} does not support signed verification messages, `,
                  'you will be asked to sign a transaction that does nothing. It will not be submitted to the chain.'
                ]),
            ],
          ]),
          m('.accounts-list', [
            app.chain.base === ChainBase.NEAR
              ? [ m(Button, {
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
              }) ]
              : app.chain.networkStatus !== ApiStatus.Connected
                ? [ ]
                : [ webWallet?.accounts.map(
                (addressOrAccount) => m(LinkAccountItem, {
                  account: typeof addressOrAccount === 'string'
                    ? { address: addressOrAccount }
                    : addressOrAccount,
                  base: app.chain.base,
                  targetCommunity,
                  accountVerifiedCallback,
                  errorCallback: (error) => { notifyError(error); },
                  linkNewAddressModalVnode: vnode,
                  webWallet,
                })
              )]
          ]),
          vnode.state.error && m('.error-message', vnode.state.error),
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step1VerifyWithCLI ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          app.chain.base === ChainBase.Substrate && [
            m('p.link-address-cli-explainer', [
              'Enter the address you are using. If you need a new address, generate one by running ',
              m('code', vnode.state.isEd25519 ? 'subkey generate --scheme ed25519' : 'subkey generate'),
            ]),
          ],
          m(Input, {
            name: 'Address',
            fluid: true,
            autocomplete: 'off',
            value: vnode.attrs.prepopulateAddress,
            placeholder: vnode.attrs.prepopulateAddress
              ? undefined
              : app.chain.base === ChainBase.Substrate
                ? 'Paste the address here (e.g. 5Dvq...)'
                : 'Paste the address here',
            oninput: async (e) => {
              const address = (e.target as any).value;
              cliAddressInputFn(address);
            },
          }),
          // // ed25519 account linking disabled for now, since while address ownership verification works,
          // // the resulting address is missing an addressId, and will not be added to the current community
          // // or set as activeAddress correctly (unclear why)
          // app.chain.base === ChainBase.Substrate && m(Checkbox, {
          //   name: 'is-ed25519',
          //   label: 'Key is ed25519 format',
          //   onchange: async (e) => {
          //     const result = (e.target as any).checked;
          //     vnode.state.isEd25519 = !!result;

          //     // resubmit creation if they check box after pasting address
          //     if (!vnode.state.enteredAddress) return;
          //     if (!vnode.state.error) {
          //       try {
          //         vnode.state.newAddress = await createUserWithAddress(AddressSwapper({
          //           address: vnode.state.enteredAddress,
          //           currentPrefix: (app.chain as Substrate).chain.ss58Format,
          //         }), vnode.state.isEd25519 ? 'ed25519' : undefined, targetCommunity);
          //       } catch (err) {
          //         vnode.state.error = err.responseJSON ? err.responseJSON.error : 'Failed to create user.';
          //       }
          //     }

          //     m.redraw();
          //   },
          // }),
          vnode.state.error && !vnode.state.newAddress && m('.error-message', vnode.state.error),
          // Allow signing iff address has been created and account has been verified
          vnode.state.newAddress && m('.link-address-cli-verification', [
            app.chain.base === ChainBase.Substrate && [
              m('p', 'Use the secret phrase to sign this message:'),
              m(CodeBlock, { clickToSelect: true }, [
                // eslint-disable-next-line max-len
                `echo "${vnode.state.newAddress.validationToken}" | subkey sign ${vnode.state.isEd25519 ? '--scheme ed25519 ' : '--suri'} "`,
                m('span.no-select', 'secret phrase'),
                '"',
              ]),
            ],
            m(Input, {
              name: 'Signature',
              fluid: true,
              autocomplete: 'off',
              style: 'display: block; margin-bottom: 18px;',
              placeholder: 'Paste the signature here (e.g. 84e34b...)',
              oninput: async (e) => {
                const signature = (e.target as any).value;
                const unverifiedAcct = vnode.state.newAddress;
                const validationToken = unverifiedAcct.validationToken;
                vnode.state.error = null;
                vnode.state.userProvidedSignature = signature;
                m.redraw();
              },
            }),
            vnode.state.error && vnode.state.newAddress && m('.error-message', vnode.state.error),
            app.chain.base === ChainBase.Substrate
              && m('p', 'Do NOT paste your secret phrase.'),
            app.chain.base === ChainBase.Substrate && m(Checkbox, {
              name: 'secret-phrase-saved',
              label: 'My secret phrase is saved somewhere safe',
              onchange: async (e) => {
                const result = (e.target as any).checked;
                vnode.state.secretPhraseSaved = result;
              },
            }),
            m(Button, {
              intent: 'primary',
              rounded: true,
              onclick: async (e) => {
                e.preventDefault();
                const unverifiedAcct: Account<any> = vnode.state.newAddress;
                unverifiedAcct.validate(vnode.state.userProvidedSignature).then(() => {
                  // if no exception was raised, account must be valid
                  accountVerifiedCallback(app.chain.accounts.get(unverifiedAcct.address));
                }, (err) => {
                  vnode.state.error = 'Verification failed';
                  m.redraw();
                });
              },
              label: 'Continue',
              disabled: !(vnode.state.userProvidedSignature
                          && (app.chain.base !== ChainBase.Substrate || vnode.state.secretPhraseSaved))
            }),
          ]),
        ]),
      ]) : vnode.state.step === LinkNewAddressSteps.Step2CreateProfile ? m('.link-address-step', [
        linkAddressHeader,
        m('.link-address-step-narrow', [
          m('.create-profile-instructions', vnode.state.isNewLogin ? [
            m('p', 'Logged in!'),
            m('p', 'Finish setting up your account, by uploading an avatar & telling us a little more about yourself:'),
          ] : [
            m('p', 'Address connected!'),
            m('p', 'Finish setting up your account, by uploading an avatar & telling us a little more about yourself:'),
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
            rounded: true,
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
      ]),
    ]);
  }
};

// inject confirmExit property
LinkNewAddressModal['confirmExit'] = confirmationModalWithText(
  'Exit now?',
  'Yes',
  'No'
);

export default LinkNewAddressModal;
