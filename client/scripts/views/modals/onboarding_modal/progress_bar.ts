import 'modals/onboarding_modal/progress_bar.scss';

import m from 'mithril';

interface IOnboardingProgressBarAttr {
  step: number;
}

const OnboardingProgressBar: m.Component<IOnboardingProgressBarAttr> = {
  view: (vnode) => {
    const { step } = vnode.attrs;

    return m('.OnboardingProgressBar', [
      m('div.titles', [
        m('span', 'Connect Wallet'),
        m('span', 'Set Up Profile'),
        m('span', 'Join Communities'),
      ]),
      m('div.bar', [
        m(`div.passed.step${step}`)
      ])
    ]);
  },
};

export default OnboardingProgressBar;
