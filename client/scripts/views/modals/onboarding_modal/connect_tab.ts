import 'modals/onboarding_modal/connect_tab.scss';

import { Button } from 'construct-ui';
import m from 'mithril';

import { onboardingCWIcon, onboardingEmailIcon, onboardingGithubIcon, onboardingWalletIcon } from '../../components/sidebar/icons';

const OnboardingModalConnectTab: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('.OnboardingModalConnectTab', [
      m('div.title', [
        m.trust(onboardingCWIcon),
        m('h2', 'Connect to Commonwealth'),
      ]),
      m('div.options', [
        m('div.option-row', [
          m('div.icon', [
            m.trust(onboardingWalletIcon),
          ]),
          m('span.description', [
            'Connect a ',
            m('strong', 'wallet address'),
            ' to start participating and receiving notifications.'
          ]),
          m(Button, {
            label: 'Connect Wallet'
          })
        ]),
        m('div.option-row', [
          m('div.icon', [
            m.trust(onboardingEmailIcon),
          ]),
          m('span.description', [
            'Sign up via ',
            m('strong', 'email'),
            ' to start recieving notifications and/or set up an crypto address if you don’t have one.'
          ]),
          m(Button, {
            label: 'Sign Up via Email'
          })
        ]),
        m('div.option-row', [
          m('div.icon', [
            m.trust(onboardingGithubIcon),
          ]),
          m('span.description', [
            'Continue with ',
            m('strong', 'Github'),
            ' to connect to Commonwealth.'
          ]),
          m(Button, {
            label: 'Continue with Github'
          })
        ])
      ]),
    ]);
  },
};

export default OnboardingModalConnectTab;
