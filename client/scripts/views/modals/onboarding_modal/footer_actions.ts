import 'modals/onboarding_modal/progress_bar.scss';

import m from 'mithril';
import { onboardingActionsLeftArrow, onboardingActionsRightArrow } from '../../components/sidebar/icons';

interface IOnboardingFooterActionsAttr {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  backDisabled?: boolean;
}

const OnboardingFooterActions: m.Component<IOnboardingFooterActionsAttr> = {
  view: (vnode) => {
    const { onBack, onNext, nextDisabled, backDisabled } = vnode.attrs;

    console.log(nextDisabled);

    const buttonClass = (disabled) => `cui-button cui-align-center cui-button-icon ${disabled ? 'disabled' : ''}`;

    return m('.OnboardingFooterActions', [
      m('button',
        {
          type: 'button',
          className: buttonClass(backDisabled),
          onclick: () => {
            if (onBack) onBack();
          }
        }, [
          m('span', { class: 'cui-button-label' }, [m.trust(onboardingActionsLeftArrow), 'BACK'])
        ]),

      m('button',
        {
          type: 'button',
          className: buttonClass(nextDisabled),
          onclick: () => {
            if (onNext) onNext();
          }
        }, [
          m('span', { class: 'cui-button-label' }, ['CONTINUE', m.trust(onboardingActionsRightArrow)])
        ]),
    ]);
  },
};

export default OnboardingFooterActions;
