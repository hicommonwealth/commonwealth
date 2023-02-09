import React from 'react';

import type {
  ResultNode
} from 'mithrilInterop';
import {
  ClassComponent,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
} from 'mithrilInterop';
import { NavigationWrapper } from 'mithrilInterop/helpers';
import $ from 'jquery';

import 'modals/confirm_cancel_new_profile_modal.scss';

import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

class ConfirmCancelNewProfileModal extends ClassComponent {
  view() {
    return (
      <div className="ConfirmCancelNewProfileModal">
        <div className="title">
          <CWText type="h4">Are You Sure You Want To Leave?</CWText>
          <CWIconButton
            iconName="close"
            onClick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            }}
          />
        </div>
        <CWText>Leaving this page will delete all profile information.</CWText>
        <div className="buttons">
          <CWButton
            label="Leave"
            buttonType="secondary-black"
            onClick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            }}
          />
          <CWButton
            label="Delete"
            buttonType="primary-black"
            onClick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalcomplete');
              $(e.target).trigger('modalexit');
              this.navigateToSubpage('/manage');
            }}
          />
        </div>
      </div>
    );
  }
}

export default NavigationWrapper(ConfirmCancelNewProfileModal);
