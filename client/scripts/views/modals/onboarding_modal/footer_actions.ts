import 'modals/onboarding_modal/progress_bar.scss';

import m from 'mithril';
import { Spinner } from 'construct-ui';
import { onboardingActionsLeftArrow, onboardingActionsRightArrow } from '../../components/sidebar/icons';

interface IOnboardingFooterActionsAttr {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  nextHidden?: boolean;
  backHidden?: boolean;
  nextSpinning?: boolean;
  isLast?: boolean;
  count?: number;
}

const OnboardingFooterActions: m.Component<IOnboardingFooterActionsAttr> = {
  view: (vnode) => {
    const { onBack, onNext, nextDisabled, backDisabled, nextHidden, backHidden, isLast, count, nextSpinning } = vnode.attrs;

    const buttonClass = (disabled, hidden) => `cui-button cui-align-center cui-button-icon ${disabled ? 'disabled' : ''} ${hidden ? 'hidden' : ''}`;

    let nextLabel = isLast ? ['FINISH'] : ['CONTINUE', m.trust(onboardingActionsRightArrow)];
    if (nextSpinning) {
      nextLabel = [m(Spinner, { active: true, size: 'xs' })];
    }

    return m('.OnboardingFooterActions', [
      m('button',
        {
          type: 'button',
          className: buttonClass(backDisabled, backHidden),
          onclick: () => {
            if (onBack) onBack();
          }
        }, [
          m('span.cui-button-label', [m.trust(onboardingActionsLeftArrow), 'BACK'])
        ]),
      m('div.next', [
        isLast ? m('div.count', [
          "You've joined ",
          m('strong', count),
          ' communities.'
        ]) : '',
        m(`button${isLast ? '.finish' : ''}`,
          {
            type: 'button',
            className: buttonClass(nextDisabled, nextHidden),
            onclick: () => {
              if (onNext) onNext();
            }
          }, [
            m('span.cui-button-label', nextLabel)
          ]),
      ]),
    ]);
  },
};

export default OnboardingFooterActions;
