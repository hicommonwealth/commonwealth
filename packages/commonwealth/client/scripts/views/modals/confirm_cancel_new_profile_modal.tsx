/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import 'modals/confirm_cancel_new_profile_modal.scss';

import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

export class ConfirmCancelNewProfileModal extends ClassComponent {
  view() {
    return (
      <div class="ConfirmCancelNewProfileModal">
        <div class="title">
          <CWText type="h4">Are You Sure You Want To Leave?</CWText>
          <CWIconButton
            iconName="close"
            onclick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            }}
          />
        </div>
        <CWText>Leaving this page will delete all profile information.</CWText>
        <div class="buttons">
          <CWButton
            label="Leave"
            buttonType="secondary-black"
            onclick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            }}
          />
          <CWButton
            label="Delete"
            buttonType="primary-black"
            onclick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalcomplete');
              $(e.target).trigger('modalexit');
              m.route.set('/profile/manage');
            }}
          />
        </div>
      </div>
    );
  }
}
