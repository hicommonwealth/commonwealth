import React from 'react';

import 'pages/settings/composer_section.scss';

import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';

import 'pages/settings/composer_section.scss';

import app from 'state';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWText } from '../../components/component_kit/cw_text';

export const ComposerSection = () => {
  const [selection, setSelection] = React.useState<string>(
    app.user.disableRichText ? 'markdown' : 'richtext'
  );

  const settingsRadioGroupOptions = [
    { label: 'Rich Text', value: 'richtext' },
    { label: 'Markdown', value: 'markdown' },
  ];

  return (
    <div className="ComposerSection">
      <CWText type="h5" fontWeight="semiBold">
        Composer
      </CWText>
      <CWRadioGroup
        options={settingsRadioGroupOptions}
        name="composerSectionRadioGroup"
        toggledOption={selection}
        onChange={async (e) => {
          setSelection(e.target.value);

          await SettingsController.disableRichText(
            e.target.value !== 'richtext'
          );

          notifySuccess('Setting saved');
        }}
      />
    </div>
  );
};
