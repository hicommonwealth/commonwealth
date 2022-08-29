import 'modals/link_new_address_modal.scss';

import m from 'mithril';
import $ from 'jquery';

import { Button, Input, Spinner, TextArea } from 'construct-ui';

import { initAppState } from 'app';
import { isSameAccount, link } from 'helpers';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { Account, AddressInfo, IWebWallet } from 'models';
import app, { ApiStatus } from 'state';

import {
  createUserWithAddress,
  setActiveAccount,
  updateActiveAddresses,
} from 'controllers/app/login';
import { notifyError, notifyInfo } from 'controllers/app/notifications';
import Substrate from 'controllers/chain/substrate/main';
import Near from 'controllers/chain/near/main';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import User from 'views/components/widgets/user';
import { AvatarUpload } from 'views/components/avatar_upload';
import { addressSwapper } from 'commonwealth/shared/utils';
import { CWValidationText } from '../components/component_kit/cw_validation_text';

enum LinkNewAddressSteps {
  Step1VerifyWithWebWallet,
  Step2CreateProfile,
}

enum LinkNewAddressWallets {
  Metamask,
  PolkadotJS,
  NEARWallet,
  CLIWallet,
}

interface ILinkNewAddressModalAttrs {
  loggingInWithAddress?: boolean; // determines whether the header says "Connect address" or "Login with address"
  joiningCommunity: string; // join community after verification
  joiningChain: string; // join chain after verification
  targetCommunity?: string; // valid when loggingInWithAddress=true and user joins community thru default chain.
  webWallet?: IWebWallet<any>;
  alreadyInitializedAccount?: Account; // skip verification, go straight to profile creation (only used for NEAR)
  prepopulateAddress?: string; // link a specific address rather than prompting
  successCallback;
}

interface ILinkNewAddressModalState {
  // meta
  step;
  error;
  selectedWallet: LinkNewAddressWallets;
  isFirstInit: boolean;
  // step 1 - validate address
  userProvidedSignature: string;
  secretPhraseSaved: boolean;
  newAddress: Account; // true if account was already initialized, otherwise it's the Account
  linkingComplete: boolean;
  // step 2 - create a profile
  isNewLogin: boolean;
  // step 3 - complete
  hasName: boolean;
  hasHeadline: boolean;
  uploadsInProgress: boolean;
  isEd25519?: boolean;
  initializingWallet: boolean;
  onpopstate;
}

const LinkAccountItem: m.Component<
  {
    account: { address: string; meta?: { name: string } };
    targetCommunity: string;
    accountVerifiedCallback: (account: Account) => Promise<void>;
    errorCallback: (error: string) => void;
    linkNewAddressModalVnode: m.Vnode<
      ILinkNewAddressModalAttrs,
      ILinkNewAddressModalState
    >;
    base: ChainBase;
    webWallet: IWebWallet<any>;
  },
  { linking: boolean }
> = {
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
    const address =
      base === ChainBase.Substrate && app.chain
        ? addressSwapper({
            address: account.address,
            currentPrefix: (app.chain as Substrate).chain.ss58Format,
          })
        : account.address;
    const isPrepopulated =
      account.address === linkNewAddressModalVnode.attrs.prepopulateAddress ||
      address === linkNewAddressModalVnode.attrs.prepopulateAddress;
    const baseName = app.chain?.meta.base || webWallet.chain;
    const capitalizedBaseName = `${baseName
      .charAt(0)
      .toUpperCase()}${baseName.slice(1)}`;
    const name =
      account.meta?.name ||
      (base === ChainBase.CosmosSDK
        ? `${app.chain?.meta.name || webWallet.defaultNetwork} address ${account.address.slice(0, 6)}...`
        : `${capitalizedBaseName} address ${account.address.slice(0, 6)}...`);
    return m(
      '.LinkAccountItem.account-item',
      {
        class: `${isPrepopulated ? 'account-item-emphasized' : ''} ${
          vnode.state.linking ? 'account-item-disabled' : ''
        }`,
        onclick: async (e) => {
          e.preventDefault();
          if (vnode.state.linking) return;

          // check address status if currently logged in
          if (app.isLoggedIn()) {
            const { result } = await $.post(
              `${app.serverUrl()}/getAddressStatus`,
              {
                address,
                chain: app.activeChainId(),
                jwt: app.user.jwt,
              }
            );
            if (result.exists) {
              if (result.belongsToUser) {
                notifyInfo(
                  'This address is already linked to your current account.'
                );
                return;
              } else {
                const modalMsg =
                  'This address is currently linked to another account. ' +
                  'Remove it from that account and transfer to yours?';
                const confirmed = await confirmationModalWithText(modalMsg)();
                if (!confirmed) {
                  vnode.state.linking = false;
                  return;
                }
              }
            }
          }

          try {
            const signerAccount = await createUserWithAddress(
              address,
              webWallet.name,
              app.chain?.id || webWallet.defaultNetwork,
            );
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
        },
      },
      [
        m('.account-item-avatar', [
          m(
            '.account-user',
            m(User, {
              user: new AddressInfo(null, address, app.chain?.id || webWallet.defaultNetwork),
              avatarOnly: true,
              avatarSize: 40,
            })
          ),
        ]),
        m('.account-item-left', [
          m('.account-item-name', `${name}`),
          m('.account-item-address', [
            m(
              '.account-user',
              m(User, {
                user: new AddressInfo(null, address, app.chain?.id || webWallet.defaultNetwork),
                hideAvatar: true,
              })
            ),
          ]),
          vnode.state.linking &&
            m('p.small-text', 'Check your wallet for a confirmation prompt.'),
        ]),
        m('.account-item-right', [
          vnode.state.linking &&
            m('.account-waiting', [
              // TODO: show a (?) icon with a tooltip explaining to check your wallet
              m(Spinner, { size: 'xs', active: true }),
            ]),
        ]),
      ]
    );
  },
};

const LinkNewAddressModal: m.Component<
  ILinkNewAddressModalAttrs,
  ILinkNewAddressModalState
> = {
  // close the modal if the user moves away from the page
  oncreate: async (vnode) => {
    if (app.chain?.base === ChainBase.NEAR || app.chain?.network === ChainNetwork.AxieInfinity) return;
    if (vnode.attrs.webWallet?.enabled) return;

      // initialize API if needed before starting webwallet
    if (vnode.state.initializingWallet) return;
    vnode.state.initializingWallet = true;
    if (!vnode.attrs.webWallet.enabling && !vnode.attrs.webWallet.enabled) {
      await vnode.attrs.webWallet?.enable();
    }
    vnode.state.initializingWallet = false;
    m.redraw();

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
      vnode.attrs.loggingInWithAddress
        ? m('h3', 'Log in with address')
        : m('h3', 'Connect address'),
    ]);

    const { targetCommunity } = vnode.attrs;

    // initialize the step
    if (vnode.state.step === undefined) {
      if (vnode.attrs.alreadyInitializedAccount) {
        vnode.state.step = LinkNewAddressSteps.Step2CreateProfile;
        vnode.state.newAddress = vnode.attrs.alreadyInitializedAccount;
      } else {
        vnode.state.step = LinkNewAddressSteps.Step1VerifyWithWebWallet;
      }
    }

    // TODO: add a step to help users install wallets
    // gaiacli 'https://cosmos.network/docs/cosmos-hub/installation.html',
    // subkey 'https://substrate.dev/docs/en/ecosystem/subkey'
    // polkadot-js 'https://github.com/polkadot-js/extension'

    const accountVerifiedCallback = async (account: Account) => {
      if (app.isLoggedIn()) {
        // existing user

        // initialize role
        try {
          // initialize AddressInfo
          // TODO: refactor so addressId is always stored on Account and we can avoid this
          //
          // Note: account.addressId is set by all createAccount
          // methods in controllers/login.ts. this means that all
          // cases should be covered (either the account comes from
          // the backend and the address is also loaded via
          // AddressInfo, or the account is created on the frontend
          // and the id is available here).
          let addressInfo = app.user.addresses.find(
            (a) => a.address === account.address && a.chain.id === account.chain.id
          );

          if (!addressInfo && account.addressId) {
            // TODO: add keytype
            addressInfo = new AddressInfo(
              account.addressId,
              account.address,
              account.chain.id,
              account.walletId
            );
            app.user.addresses.push(addressInfo);
          }

          // link the address to the community
          if (app.chain) {
            try {
              if (
                vnode.attrs.joiningChain &&
                !app.roles.getRoleInCommunity({
                  account,
                  chain: vnode.attrs.joiningChain,
                })
              ) {
                await app.roles.createRole({
                  address: addressInfo,
                  chain: vnode.attrs.joiningChain,
                });
              }
            } catch (e) {
              // this may fail if the role already exists, e.g. if the address is being migrated from another user
              console.error('Failed to create role');
            }
          }

          // set the address as active
          await setActiveAccount(account);
          if (
            app.user.activeAccounts.filter((a) => isSameAccount(a, account))
              .length === 0
          ) {
            app.user.setActiveAccounts(
              app.user.activeAccounts.concat([account])
            );
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

        $('.LinkNewAddressModal').trigger('modalforceexit');
        if (vnode.attrs.successCallback) vnode.attrs.successCallback();
        m.redraw();
      } else {
        // log in as the new user
        await initAppState(false);
        // load addresses for the current chain/community
        if (app.chain) {
          // TODO: this breaks when the user action creates a new token forum
          const chain =
            app.user.selectedChain ||
            app.config.chains.getById(app.activeChainId());
          await updateActiveAddresses(chain);
        }
        $('.LinkNewAddressModal').trigger('modalforceexit');
        if (vnode.attrs.successCallback) vnode.attrs.successCallback();
        vnode.state.newAddress = account;
        vnode.state.isNewLogin = true;
        vnode.state.error = null;
        m.redraw();
      }
    };

    const webWallet = vnode.attrs.webWallet;
    const prepopulatedAddressInputFn = async (address) => {
      vnode.state.error = null;

      // Prevent validation on empty field
      if (address === '') {
        return;
      }

      if (app.user.activeAccounts.find((acct) => acct.address === address)) {
        vnode.state.error = 'You have already linked this address';
      }

      if (!vnode.state.error) {
        try {
          vnode.state.newAddress = await createUserWithAddress(
            address,
            webWallet.name,
            app.chain?.id || webWallet.defaultNetwork
          );
        } catch (err) {
          vnode.state.error = err.responseJSON
            ? err.responseJSON.error
            : 'Failed to create user.';
        }
      }

      m.redraw();
    };

    // immediately trigger address population if given
    if (vnode.attrs.prepopulateAddress && vnode.state.isFirstInit) {
      vnode.state.isFirstInit = false;
      prepopulatedAddressInputFn(vnode.attrs.prepopulateAddress);
    }

    return m('.LinkNewAddressModal', [
      vnode.state.step === LinkNewAddressSteps.Step1VerifyWithWebWallet
        ? m('.link-address-step', [
            linkAddressHeader,
            m('.link-address-step-narrow', [
              !webWallet?.available &&
                m('.get-wallet-text', [
                  'Install a compatible wallet to continue',
                  m('br'),
                  app.chain?.base === ChainBase.Substrate &&
                    link(
                      'a',
                      'https://polkadot.js.org/extension/',
                      'Get polkadot-js',
                      { target: '_blank' }
                    ),
                  app.chain?.base === ChainBase.Ethereum &&
                    link('a', 'https://metamask.io/', 'Get Metamask', {
                      target: '_blank',
                    }),
                  app.chain?.base === ChainBase.CosmosSDK &&
                    app.chain?.network !== ChainNetwork.Terra &&
                    link('a', 'https://wallet.keplr.app/', 'Get Keplr', {
                      target: '_blank',
                    }),
                  app.chain?.network === ChainNetwork.Terra &&
                    link('a', 'https://www.terra.money/', 'Get Terra', {
                      target: '_blank',
                    }),
                ]),
              webWallet?.enabled &&
                m('.accounts-caption', [
                  (() => {
                    if (webWallet?.accounts.length === 0) {
                      return [
                        m('br'),
                        m(
                          'p',
                          'Wallet connected, but no accounts were found. Please make sure you are signed in to your wallet and try again.'
                        ),
                      ];
                    } else if (webWallet.chain === ChainBase.Ethereum) {
                      return [
                        // metamask + walletconnect
                        m(
                          'p.small-text',
                          'Use your wallet to switch between accounts.'
                        ),
                      ];
                    } else {
                      return [
                        m('p', 'Select an address:'),
                        m(
                          'p.small-text',
                          'Look for a popup, or check your wallet/browser extension.'
                        ),
                        (() => {
                          if (
                            webWallet.chain === ChainBase.CosmosSDK &&
                            app.chain?.network !== ChainNetwork.Terra
                          ) {
                            return m('p.small-text', [
                              `Because ${webWallet.name} does not support signed verification messages, `,
                              'you will be asked to sign a transaction that does nothing. It will not be submitted to the chain.',
                            ]);
                          }
                        })(),
                      ];
                    }
                  })(),
                ]),
              m('.accounts-list', [
                (() => {
                  if (app.chain?.base === ChainBase.NEAR) {
                    return [
                      m(Button, {
                        intent: 'primary',
                        rounded: true,
                        onclick: async (e) => {
                          // redirect to NEAR page for login
                          const WalletAccount = (await import('near-api-js')).WalletAccount;
                          if (!app.chain.apiInitialized) {
                            await app.chain.initApi();
                          }
                          const wallet = new WalletAccount(
                            (app.chain as Near).chain.api,
                            'commonwealth_near'
                          );
                          if (wallet.isSignedIn()) {
                            // get rid of pre-existing wallet info to make way for new account
                            wallet.signOut();
                          }
                          const redirectUrl = !app.isCustomDomain()
                            ? `${
                                window.location.origin
                              }/${app.activeChainId()}/finishNearLogin`
                            : `${window.location.origin}/finishNearLogin`;
                          wallet.requestSignIn({
                            contractId: (app.chain as Near).chain.isMainnet
                              ? 'commonwealth-login.near'
                              : 'commonwealth-login.testnet',
                            successUrl: redirectUrl,
                            failureUrl: redirectUrl,
                          });
                        },
                        label: 'Continue to NEAR wallet',
                      }),
                    ];
                  } else if (app.chain?.network === ChainNetwork.AxieInfinity) {
                    return [
                      m(Button, {
                        intent: 'primary',
                        rounded: true,
                        onclick: async (e) => {
                          // get a state id from the server
                          const result = await $.post(
                            `${app.serverUrl()}/auth/sso`,
                            { issuer: 'AxieInfinity' }
                          );
                          if (
                            result.status === 'Success' &&
                            result.result.stateId
                          ) {
                            const stateId = result.result.stateId;

                            // redirect to axie page for login
                            window.location.href = `https://marketplace.axieinfinity.com/login/?src=commonwealth&stateId=${stateId}`;
                          } else {
                            vnode.state.error(
                              result.error || 'Could not login'
                            );
                          }
                        },
                        label: 'Continue to Ronin wallet',
                      }),
                    ];
                  } else {
                    return [
                      webWallet?.accounts.map((addressOrAccount) =>
                        m(LinkAccountItem, {
                          account:
                            typeof addressOrAccount === 'string'
                              ? { address: addressOrAccount }
                              : addressOrAccount,
                          base: app.chain?.base || webWallet.chain,
                          targetCommunity,
                          accountVerifiedCallback,
                          errorCallback: (error) => {
                            notifyError(error);
                          },
                          linkNewAddressModalVnode: vnode,
                          webWallet,
                        })
                      ),
                    ];
                  }
                })(),
              ]),
              vnode.state.error &&
                m(CWValidationText, {
                  message: vnode.state.error,
                  status: 'failure',
                }),
            ]),
          ])
        : vnode.state.step === LinkNewAddressSteps.Step2CreateProfile
        ? m('.link-address-step', [
            linkAddressHeader,
            m('.link-address-step-narrow', [
              m(
                '.create-profile-instructions',
                vnode.state.isNewLogin
                  ? [
                      m('p', 'Logged in!'),
                      m(
                        'p',
                        'Finish setting up your account, by uploading an avatar & telling us a little more about yourself:'
                      ),
                    ]
                  : [
                      m('p', 'Address connected!'),
                      m(
                        'p',
                        'Finish setting up your account, by uploading an avatar & telling us a little more about yourself:'
                      ),
                    ]
              ),
              m('.avatar-wrap', [
                m(AvatarUpload, {
                  scope: 'user',
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
                      $('.LinkNewAddressModal')
                        .find('input[name=avatarUrl]')
                        .val(url.trim());
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
                  if (
                    vnode.state.newAddress &&
                    vnode.state.newAddress.profile &&
                    vnode.state.newAddress.profile.name
                  ) {
                    $(vvnode.dom)
                      .find('input[type="text"]')
                      .val(vnode.state.newAddress.profile.name);
                    vnode.state.hasName = true;
                    m.redraw();
                  } else if (
                    vnode.state.newAddress.chain.base === ChainBase.NEAR
                  ) {
                    $(vvnode.dom)
                      .find('input[type="text"]')
                      .val(vnode.state.newAddress.address);
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
                  if (
                    vnode.state.newAddress &&
                    vnode.state.newAddress.profile
                  ) {
                    $(vvnode.dom)
                      .find('input[type="text"]')
                      .val(vnode.state.newAddress.profile.headline);
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
              vnode.state.error &&
                m(CWValidationText, {
                  message: `${vnode.state.error}. Try again?`,
                  status: 'failure',
                }),
              m(Button, {
                intent: 'primary',
                rounded: true,
                disabled: vnode.state.uploadsInProgress || !vnode.state.hasName,
                onclick: async (e) => {
                  e.preventDefault();
                  const $form = $('.LinkNewAddressModal');
                  const data = {
                    name: `${$form.find('input[name=name]').val()}`,
                    headline: `${$form.find('input[name=headline]').val()}`,
                    bio: `${$form.find('textarea[name=bio]').val()}`,
                    avatarUrl: `${$form.find('input[name=avatarUrl]').val()}`,
                  };
                  app.profiles
                    .updateProfileForAccount(vnode.state.newAddress, data)
                    .then((args) => {
                      vnode.state.error = null;
                      $form.trigger('modalforceexit');
                      if (vnode.attrs.successCallback)
                        vnode.attrs.successCallback();
                      m.redraw();
                    })
                    .catch((err) => {
                      vnode.state.error = err.responseJSON
                        ? err.responseJSON.error
                        : 'Unable to create profile';
                      m.redraw();
                    });
                },
                label: 'Save and finish',
              }),
            ]),
          ])
        : m('.link-address-step', [
            m('.link-address-step-header', [m('h3', 'Error')]),
          ]),
    ]);
  },
};

// inject confirmExit property
LinkNewAddressModal['confirmExit'] = confirmationModalWithText(
  'Exit now?',
  'Yes',
  'No'
);

export default LinkNewAddressModal;
