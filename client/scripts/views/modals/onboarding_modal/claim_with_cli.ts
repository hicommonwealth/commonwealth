import 'modals/onboarding_modal/claim_with_cli.scss';

import m, { Vnode } from 'mithril';
import { Form, FormGroup, Input, Checkbox, Spinner } from 'construct-ui';
import { Account, ChainBase } from 'models';
import app from 'state';
import { isU8a, isHex } from '@polkadot/util';
import { createUserWithAddress } from 'controllers/app/login';
import Substrate from 'controllers/chain/substrate/main';
import CodeBlock from 'views/components/widgets/code_block';

import { onboardingCWIcon, onboardingArrowLeftRightIcon, onboardingCLIIcon } from '../../components/sidebar/icons';
import AddressSwapper from '../../components/addresses/address_swapper';

import OnboardingFooterActions from './footer_actions';


interface IOnboardingCLIAttr {
  onNext: () => void;
  onBack: () => void;
  address: string;
  accountVerifiedCallback: (account: Account<any>, onNext: (account: Account<any>) => void) => void;
}

const OnboardingCLI: m.Component<IOnboardingCLIAttr, {
  error;
  userProvidedSignature: string;
  secretPhraseSaved: boolean;
  newAddress: Account<any>;
  isEd25519: boolean;
  loadingNewAddress: boolean;
}> = {
  oninit: async (vnode) => {
    const { address } = vnode.attrs;
    vnode.state.error = null;
    vnode.state.loadingNewAddress = true;
    vnode.state.newAddress = null;

    // Prevent validation on empty field
    if (address === '') {
      vnode.state.loadingNewAddress = false;
      vnode.state.error = 'Address should not be empty.';
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
        vnode.state.newAddress = await createUserWithAddress(AddressSwapper({
          address,
          currentPrefix: (app.chain as Substrate).chain.ss58Format,
        }), vnode.state.isEd25519 ? 'ed25519' : undefined, app.activeCommunityId());
      } catch (err) {
        vnode.state.error = err.responseJSON ? err.responseJSON.error : 'Failed to create user.';
      }
    }

    vnode.state.loadingNewAddress = false;

    m.redraw();
  },
  view: (vnode) => {
    const { accountVerifiedCallback } = vnode.attrs;
    const { loadingNewAddress } = vnode.state;
    let content: Vnode[] = [];

    if (loadingNewAddress) {
      content = [
        m(Spinner, {
          size: 'lg',
          active: true,
        })
      ];
    } else {
      if (!vnode.state.newAddress) {
        content = [
          vnode.state.error && m('.error-message', vnode.state.error),
        ];
      } else {
        content = [
          m('span', 'Use the secret phrase to sign the following message:'),
          m(CodeBlock, { clickToSelect: true }, [
            `echo "${vnode.state.newAddress.validationToken}" | subkey sign ${vnode.state.isEd25519 ? '--scheme ed25519 ' : ''} "`,
            m('span.no-select', 'secret phrase'),
            '"',
          ]),
          m(Form, { class: 'OnboardingChooseWalletForm' }, [
            m(FormGroup, [
              m(Input, {
                name: 'Signature',
                fluid: true,
                autocomplete: 'off',
                style: 'display: block; margin-bottom: 18px;',
                placeholder: 'Paste the signature here (e.g. 84e34b...)',
                oninput: async (e) => {
                  const signature = (e.target as any).value;
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
            ])
          ])
        ];
      }
    }

    return m('.OnboardingCLI', [
      m('div.title', [
        m('div.icons', [
          m.trust(onboardingCLIIcon),
          m.trust(onboardingArrowLeftRightIcon),
          m.trust(onboardingCWIcon),
        ]),
        m('h2', 'Claim Address with Command Line'),
      ]),
      m('div.targetAddress', vnode.attrs.address),
      m('div.targetAddress.mobile', [vnode.attrs.address?.slice(0, 10), '...', vnode.attrs.address?.slice(-10)]),
      m('div.content', content),
      m(OnboardingFooterActions, {
        backDisabled: false,
        nextHidden: false,
        nextDisabled: !(vnode.state.userProvidedSignature
          && (app.chain.base !== ChainBase.Substrate || vnode.state.secretPhraseSaved)),
        onBack: vnode.attrs.onBack,
        onNext: () => {
          console.log(vnode.state);
          const unverifiedAcct: Account<any> = vnode.state.newAddress;
          unverifiedAcct.validate(vnode.state.userProvidedSignature).then(() => {
            // if no exception was raised, account must be valid
            accountVerifiedCallback(app.chain.accounts.get(unverifiedAcct.address), vnode.attrs.onNext);
          }, (err) => {
            vnode.state.error = 'Verification failed';
            m.redraw();
          });
        }
      })
    ]);
  },
};

export default OnboardingCLI;
