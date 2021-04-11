import 'modals/onboarding_modal/index.scss';

import m from 'mithril';
import OnboardingConnect from './connect_tab';
import OnboardingModalSetupProfileTab from './setup_profile_tab';
import OnboardingProgressBar from './progress_bar';
import OnboardingChooseWallet from './choose_wallet';

interface IOnboardingState {
  step: number;
}

const OnboardingModal: m.Component<{}, IOnboardingState> = {
  oninit: (vnode) => {
    vnode.state.step = 0;
  },
  view: (vnode) => {
    const { step } = vnode.state;
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
          onBack: () => {
            vnode.state.step = 0;
          },
          onNext: () => {
            vnode.state.step = 2;
          }
        }) : '',
      m('div.footerL'),
      m('div.footerR'),
    ]);
  }
};

export default OnboardingModal;
