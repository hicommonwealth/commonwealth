import 'modals/onboarding_modal/index.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { AddressInfo, ChainBase, Account } from 'models';

import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { baseToNetwork } from 'models/types';
import { isSameAccount } from 'helpers';
import { initAppState } from 'app';

import { updateActiveAddresses, setActiveAccount } from 'controllers/app/login';

import OnboardingProgressBar from './progress_bar';
import OnboardingConnect from './connect_tab';
import OnboardingChooseWallet from './choose_wallet';
import OnboardingChooseAddress from './choose_address';
import OnboardingSetupProfile from './setup_profile_tab';
import OnboardingJoinCommunity from './join_community';
import OnboardingCLI from './claim_with_cli';

enum OnboardingStep {
  Connect = 0,
  ChooseWallet = 1,
  ChooseAddress = 2,
  SetupProfile = 3,
  JoinCommunity = 4,
  CLI = 5
}

interface IOnboardingState {
  step: number;
  selected: ChainBase;
  account: Account<any>;
}

interface IOnboardingAttrs {
  joiningChain?: string;
  joiningCommunity?: string;
  address: string;
  step: string;
}

const OnboardingModal: m.Component<IOnboardingAttrs, IOnboardingState> = {
  oninit: (vnode) => {
    vnode.state.step = parseInt(vnode.attrs.step, 10) || OnboardingStep.Connect;
    vnode.state.selected = null;
    vnode.state.account = null;
  },
  view: (vnode) => {
    const { step } = vnode.state;
    const { joiningChain, joiningCommunity, address } = vnode.attrs;

    const accountVerifiedCallback = async (account: Account<any>, onNext: (account: Account<any>) => void) => {
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
        if (onNext) onNext(account);
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
        if (onNext) onNext(account);
        m.redraw();
      }
    };

    return m('.OnboardingModal', [
      m(OnboardingProgressBar, { step: vnode.state.step }),
      step === OnboardingStep.Connect ? m(OnboardingConnect, {
        address,
        onUseWallet: () => {
          vnode.state.step = OnboardingStep.ChooseWallet;
        },
        onUseCLI: () => {
          vnode.state.step = OnboardingStep.CLI;
        }
      })
        : step === OnboardingStep.ChooseWallet ? m(OnboardingChooseWallet, {
          selected: vnode.state.selected,
          onSelect: (base) => {
            vnode.state.selected = base;
          },
          onBack: () => {
            vnode.state.step = OnboardingStep.Connect;
            vnode.state.selected = null;
          },
          onNext: () => {
            vnode.state.step = OnboardingStep.ChooseAddress;
            if (joiningCommunity) {
              app.modals.removeAll();

              const scope = baseToNetwork(vnode.state.selected);
              m.route.set(`/${scope}/account/${vnode.attrs.address}`, {
                base: m.route.param('base'),
                joiningChain,
                joiningCommunity,
                step: OnboardingStep.ChooseAddress,
              });
            }
          },
        }) : step === OnboardingStep.ChooseAddress ? m(OnboardingChooseAddress, {
          address,
          joiningChain,
          joiningCommunity,
          base: vnode.state.selected,
          onBack: () => {
            vnode.state.step = OnboardingStep.ChooseWallet;
            if (joiningCommunity) {
              app.modals.removeAll();
              m.route.set(`/${joiningCommunity}/account/${vnode.attrs.address}`, {
                base: m.route.param('base'),
                joiningChain: vnode.attrs.joiningChain,
                joiningCommunity: vnode.attrs.joiningCommunity,
                step: OnboardingStep.ChooseWallet,
              });
            }
          },
          onNext: (account: Account<any>) => {
            vnode.state.account = account;
            vnode.state.step = OnboardingStep.SetupProfile;
          },
          accountVerifiedCallback
        }) : step === OnboardingStep.SetupProfile ? m(OnboardingSetupProfile, {
          account: vnode.state.account,
          onBack: () => {
            vnode.state.step = OnboardingStep.ChooseAddress;
          },
          onNext: () => {
            vnode.state.step = OnboardingStep.JoinCommunity;
          }
        }) : step === OnboardingStep.JoinCommunity ? m(OnboardingJoinCommunity, {
          account: vnode.state.account,
          base: vnode.state.selected,
          onBack: () => {
            vnode.state.step = OnboardingStep.SetupProfile;
          },
          onNext: () => {
            $('.OnboardingModal').trigger('modalexit');
            notifySuccess('Claimed the address successfully!');
          }
        }) : step === OnboardingStep.CLI ? m(OnboardingCLI, {
          address,
          onBack: () => {
            vnode.state.step = OnboardingStep.Connect;
          },
          onNext: () => {
            vnode.state.step = OnboardingStep.SetupProfile;
          },
          accountVerifiedCallback
        }) : '',
      m('div.footerL'),
      m('div.footerR'),
    ]);
  }
};

export default OnboardingModal;
