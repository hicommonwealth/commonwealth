import 'modals/onboarding_modal/index.scss';

import m from 'mithril';
import Tabs from 'views/components/widgets/tabs';
import OnboardingModalConnectTab from './connect_tab';
import OnboardingModalSetupProfileTab from './setup_profile_tab';
import { onboardingFooterLIcon, onboardingFooterRIcon } from '../../components/sidebar/icons';

const OnboardingModal: m.Component<{}> = {
  view: (vnode) => {
    return m('.OnboardingModal', [
      m('div.onboarding-modal-content', [
        m(Tabs, [{
          name: 'Connect',
          content: m(OnboardingModalConnectTab)
        }, {
          name: 'Set Up Profile',
          content: m(OnboardingModalSetupProfileTab),
        }, {
          name: 'Join Communities',
          content: 'Connect to Commonwealth',
        }]),
        m('div.footerL', [
          m.trust(onboardingFooterLIcon),
        ]),
        m('div.footerR', [
          m.trust(onboardingFooterRIcon),
        ]),
      ]),
    ]);
  }
};

export default OnboardingModal;
