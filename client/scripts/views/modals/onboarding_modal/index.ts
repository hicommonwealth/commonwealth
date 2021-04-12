import 'modals/onboarding_modal/index.scss';

import m from 'mithril';
import $ from 'jquery';
import { ChainBase } from 'client/scripts/models';
import { Account } from 'models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

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
}

const OnboardingModal: m.Component<IOnboardingAttrs, IOnboardingState> = {
  oninit: (vnode) => {
    vnode.state.step = 0;
    vnode.state.selected = null;
    vnode.state.account = null;
  },
  view: (vnode) => {
    const { step } = vnode.state;
    const { joiningChain, joiningCommunity } = vnode.attrs;
    const onUseWallet = () => {
      vnode.state.step = 1;
    };

    const onUseCLI = () => {
      vnode.state.step = 2;
    };
    return m('.OnboardingModal', [
      m(OnboardingProgressBar, { step: vnode.state.step }),
      step === 0 ? m(OnboardingConnect, {
        onUseWallet,
        onUseCLI
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
          },
        }) : step === 2 ? m(OnboardingChooseAddress, {
          joiningChain,
          joiningCommunity,
          base: vnode.state.selected,
          onBack: () => {
            vnode.state.step = 1;
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
