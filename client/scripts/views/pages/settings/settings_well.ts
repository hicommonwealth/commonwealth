import 'pages/settings/settings_well.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import { RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { Icon, Icons, Button, Input } from 'construct-ui';

const SettingsWell: m.Component<{}, { initialized: boolean }> = {
  view: (vnode) => {
    return m('form.SettingsWell', [
      m('h4', 'Composer'),
      m('.composer', [
        m(RadioSelectorFormField, {
          callback: async (value) => {
            await SettingsController.disableRichText(value !== 'richtext');
            notifySuccess('Setting saved');
          },
          choices: [
            { label: 'Rich Text', value: 'richtext', checked: !app.user.disableRichText },
            { label: 'Markdown', value: 'markdown', checked: app.user.disableRichText === true }
          ],
          name: 'composer',
        })
      ]),
    ]);
  }
};

export default SettingsWell;
