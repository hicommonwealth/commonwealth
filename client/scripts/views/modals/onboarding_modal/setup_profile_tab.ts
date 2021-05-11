import 'modals/onboarding_modal/setup_profile_tab.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Account } from 'models';

import { Grid, Col, Form, FormGroup, FormLabel, Input, Button, TextArea } from 'construct-ui';
import { onboardingProfileIcon } from '../../components/sidebar/icons';
import OnboardingFooterActions from './footer_actions';

interface IOnboardingProfileForm {
  name?: string;
  email?: string;
  headline?: string;
  bio?: string;
}

interface IOnboardingSetupProfileAttrs {
  account: Account<any>;
  onBack: () => void;
  onNext: () => void;
}

const OnboardingSetupProfile: m.Component<IOnboardingSetupProfileAttrs, { form: IOnboardingProfileForm, saving: boolean, error: string }> = {
  oninit: (vnode) => {
    vnode.state.form = {
      name: vnode.attrs.account?.profile?.name || '',
      email: '',
      headline: vnode.attrs.account?.profile?.headline || '',
      bio: vnode.attrs.account?.profile?.bio || '',
    };
    vnode.state.saving = false;
    vnode.state.error = null;
  },
  view: (vnode) => {
    const { account } = vnode.attrs;
    return m('.OnboardingSetupProfile', [
      m('div.title', [
        m.trust(onboardingProfileIcon),
        m('h2', 'Let’s set up your profile'),
        m('div', 'Optionally tell us a bit about yourself.'),
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
              m(FormLabel, 'Email'),
              m(Input, {
                name: 'email',
                placeholder: 'Paste your email here',
                defaultValue: '',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.email = result;
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
              m(TextArea, {
                name: 'bio',
                defaultValue: '',
                placeholder: 'A short summary',
                fluid: true,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.bio = result;
                  m.redraw();
                }
              }),
            ]),
          ]),
        ]),
      ]),
      m(OnboardingFooterActions, {
        backDisabled: vnode.state.saving,
        nextDisabled: !vnode.state.form.name?.length || vnode.state.saving,
        nextSpinning: vnode.state.saving,
        onBack: vnode.attrs.onBack,
        onNext: () => {
          const data = {
            bio: vnode.state.form.bio,
            email: vnode.state.form.email,
            headline: vnode.state.form.headline,
            name: vnode.state.form.name,
          };
          vnode.state.saving = true;
          app.profiles.updateProfileForAccount(account, data).then((result) => {
            vnode.state.saving = false;
            m.redraw();
            vnode.attrs.onNext();
          }).catch((error: any) => {
            vnode.state.saving = false;
            vnode.state.error = error.responseJSON ? error.responseJSON.error : error.responseText;
            m.redraw();
          });
        },
      })
    ]);
  },
};

export default OnboardingSetupProfile;
