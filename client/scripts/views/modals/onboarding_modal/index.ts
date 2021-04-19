import 'modals/onboarding_modal/index.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { ChainBase, Account } from 'models';

import { notifySuccess } from 'controllers/app/notifications';
import { baseToNetwork } from 'models/types';

import OnboardingProgressBar from './progress_bar';
import OnboardingConnect from './connect_tab';
import OnboardingChooseWallet from './choose_wallet';
import OnboardingChooseAddress from './choose_address';
import OnboardingSetupProfile from './setup_profile_tab';
import OnboardingJoinCommunity from './join_community';

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
    vnode.state.step = parseInt(vnode.attrs.step, 10) || 0;
    vnode.state.selected = null;
    vnode.state.account = null;
  },
  view: (vnode) => {
    const { step } = vnode.state;
    const { joiningChain, joiningCommunity, address } = vnode.attrs;

    return m('.OnboardingModal', [
      m(OnboardingProgressBar, { step: vnode.state.step }),
      step === 0 ? m(OnboardingConnect, {
        address,
        onUseWallet: () => {
          vnode.state.step = 1;
        },
        onUseCLI: () => {
          vnode.state.step = 2;
        }
      })
        : step === 1 ? m(OnboardingChooseWallet, {
          selected: vnode.state.selected,
          onSelect: (base) => {
            vnode.state.selected = base;
          },
          onBack: () => {
            vnode.state.step = 0;
            vnode.state.selected = null;
          },
          onNext: () => {
            vnode.state.step = 2;
            if (joiningCommunity) {
              app.modals.removeAll();

              const scope = baseToNetwork(vnode.state.selected);
              m.route.set(`/${scope}/account/${vnode.attrs.address}`, {
                base: m.route.param('base'),
                joiningChain,
                joiningCommunity,
                step: 2,
              });
            }
          },
        }) : step === 2 ? m(OnboardingChooseAddress, {
          address,
          joiningChain,
          joiningCommunity,
          base: vnode.state.selected,
          onBack: () => {
            vnode.state.step = 1;
            if (joiningCommunity) {
              app.modals.removeAll();
              m.route.set(`/${joiningCommunity}/account/${vnode.attrs.address}`, {
                base: m.route.param('base'),
                joiningChain: vnode.attrs.joiningChain,
                joiningCommunity: vnode.attrs.joiningCommunity,
                step: 1,
              });
            }
          },
          onNext: (account: Account<any>) => {
            vnode.state.account = account;
            vnode.state.step = 3;
          }
        }) : step === 3 ? m(OnboardingSetupProfile, {
          account: vnode.state.account,
          onBack: () => {
            vnode.state.step = 2;
          },
          onNext: () => {
            vnode.state.step = 4;
          }
        }) : step === 4 ? m(OnboardingJoinCommunity, {
          account: vnode.state.account,
          onBack: () => {
            vnode.state.step = 3;
          },
          onNext: () => {
            $('.OnboardingModal').trigger('modalexit');
            notifySuccess('Claimed the address successfully!');
          }
        }) : '',
      m('div.footerL'),
      m('div.footerR'),
    ]);
  }
};

export default OnboardingModal;
