import 'modals/onboarding_modal/setup_profile_tab.scss';

import m from 'mithril';

import { Grid, Col, Form, FormGroup, FormLabel, Input, Button } from 'construct-ui';
import { onboardingWalletIcon } from '../../components/sidebar/icons';

interface IOnboardingProfileForm {
  name?: string;
  headline?: string;
  bio?: string;
}

const OnboardingModalSetupProfileTab: m.Component<{}, { form: IOnboardingProfileForm }> = {
  oninit: (vnode) => {
    vnode.state.form = {
      name: '',
      headline: '',
      bio: '',
    };
  },
  view: (vnode) => {
    return m('.OnboardingModalSetupProfileTab', [
      m('div.title', [
        m.trust(onboardingWalletIcon),
        m('h2', 'Let’s setup your profile'),
        m('div', 'Don’t worry. We’ve got you covered if you don’t.'),
      ]),
      m(Form, { class: 'OnboardingProfileForm' }, [
        m(Grid, [
          m(Col, [
            m(FormGroup, [
              m(FormLabel, 'Name'),
              m(Input, {
                name: 'name',
                placeholder: 'Enter your name',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.name = result;
                  m.redraw();
                }
              }),
              m(FormLabel, 'Headline'),
              m(Input, {
                name: 'headline',
                placeholder: 'Your essence in a line',
                defaultValue: '',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.headline = result;
                  m.redraw();
                }
              }),
              m(FormLabel, 'Bio'),
              m(Input, {
                name: 'bio',
                placeholder: 'A short summary',
                defaultValue: '',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.bio = result;
                  m.redraw();
                }
              }),
            ]),
            m(FormGroup, [
              m(Button, {
                intent: 'primary',
                rounded: true,
                label: 'CONTINUE',
                onclick: async (e) => {
                  e.preventDefault();
                  m.redraw();
                },
                type: 'submit',
              }),
            ]),
          ]),
        ]),
      ]),
    ]);
  },
};

export default OnboardingModalSetupProfileTab;
