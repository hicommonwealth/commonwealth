/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'pages/settings/composer_section.scss';

import app from 'state';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { CWText } from '../../components/component_kit/cw_text';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';

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
      <div className="ComposerSection">
        <CWText type="h5" fontWeight="semiBold">
          Composer
        </CWText>
        <CWRadioGroup
          options={settingsRadioGroupOptions}
          name="composerSectionRadioGroup"
          toggledOption={this.selection}
          onChange={async (e) => {
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
