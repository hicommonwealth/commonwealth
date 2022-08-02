/* @jsx m */

import m from 'mithril';

import 'pages/settings/composer_section.scss';

import app from 'state';
import { RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';

export class ComposerSection implements m.ClassComponent {
  view() {
    return m('SettingsSection', [
      m('h4', 'Composer'),
      m(RadioSelectorFormField, {
        callback: async (value) => {
          await SettingsController.disableRichText(value !== 'richtext');
          notifySuccess('Setting saved');
        },
        choices: [
          {
            label: 'Rich Text',
            value: 'richtext',
            checked: !app.user.disableRichText,
          },
          {
            label: 'Markdown',
            value: 'markdown',
            checked: app.user.disableRichText === true,
          },
        ],
        name: 'composer',
      }),
    ]);
  }
}
