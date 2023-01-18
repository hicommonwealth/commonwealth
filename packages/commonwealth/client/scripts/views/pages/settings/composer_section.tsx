/* @jsx m */

import ClassComponent from 'class_component';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import m from 'mithril';

import 'pages/settings/composer_section.scss';

import app from 'state';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWText } from '../../components/component_kit/cw_text';

export class ComposerSection extends ClassComponent {
  private selection: string;

  oninit() {
    this.selection = app.user.disableRichText ? 'markdown' : 'richtext';
  }

  view() {
    const settingsRadioGroupOptions = [
      { label: 'Rich Text', value: 'richtext' },
      { label: 'Markdown', value: 'markdown' },
    ];

    return (
      <div class="ComposerSection">
        <CWText type="h5" fontWeight="semiBold">
          Composer
        </CWText>
        <CWRadioGroup
          options={settingsRadioGroupOptions}
          name="composerSectionRadioGroup"
          toggledOption={this.selection}
          onchange={async (e) => {
            this.selection = e.target.value;
            await SettingsController.disableRichText(
              e.target.value !== 'richtext'
            );
            notifySuccess('Setting saved');
          }}
        />
      </div>
    );
  }
}
