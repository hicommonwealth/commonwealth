
import 'components/settings/email_well.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { SocialAccount } from 'models';
import { Button, Input, Icons, Icon, Tooltip } from 'construct-ui';

interface IState {
  email: string;
  emailVerified: boolean;
}

const EmailWell: m.Component<{}, IState> = {
  oninit: (vnode) => {
    vnode.state.email = app.login.email;
    vnode.state.emailVerified = app.login.emailVerified;
  },
  view: (vnode) => {
    return m('.EmailWell', [
      m('h4', 'Email'),
      m(Input, {
        contentLeft: m(Icon, { name: Icons.MAIL }),
        defaultValue: vnode.state.email || null,
        onkeyup: (e) => { vnode.state.email = (e.target as any).value; },
      }),
      m(Button, {
        label: 'Update Email',
        onclick: async () => {
          try {
            if (vnode.state.email === app.login.email) return;
            const response = await $.post(`${app.serverUrl()}/updateEmail`, {
              'email': vnode.state.email,
              'jwt': app.login.jwt,
            });
            app.login.email = response.result.email;
            vnode.state.emailVerified = false;
            m.redraw();
          } catch (err) {
            console.log('Failed to update email');
            throw new Error((err.responseJSON && err.responseJSON.error)
              ? err.responseJSON.error
              : 'Failed to update email');
          }
        }
      }),
      m(Tooltip, {
        content: vnode.state.emailVerified ? 'Email verified' : 'Email not verified',
        position: 'top',
        transitionDuration: 0,
        trigger: m(Icon, {
          size: 'lg',
          name: vnode.state.emailVerified ? Icons.CHECK_CIRCLE : Icons.X_CIRCLE,
        }),
      }),
    ]);
  },
};

export default EmailWell;
