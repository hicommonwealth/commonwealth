import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';
import { NavigationWrapper } from 'mithrilInterop/helpers';
import $ from 'jquery';

import 'modals/confirm_cancel_new_profile_modal.scss';

import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type ConfirmCancelNewProfileModalAttrs = {
  closeModal: () => void;
}

class ConfirmCancelNewProfileModal extends ClassComponent<ConfirmCancelNewProfileModalAttrs> {
  view(vnode: ResultNode<ConfirmCancelNewProfileModalAttrs>) {
    const { closeModal } = vnode.attrs;

    return (
      <div className="ConfirmCancelNewProfileModal">
        <div className="title">
          <CWText type="h4">Are You Sure You Want To Leave?</CWText>
          <CWIconButton
            iconName="close"
            onClick={closeModal}
          />
        </div>
        <CWText>Leaving this page will delete all profile information.</CWText>
        <div className="buttons">
          <CWButton
            label="Leave"
            buttonType="secondary-black"
            onClick={closeModal}
          />
          <CWButton
            label="Delete"
            buttonType="primary-black"
            onClick={() => {
              closeModal();
              this.navigateToSubpage('/manage');
            }}
          />
        </div>
      </div>
    );
  }
}

export default NavigationWrapper(ConfirmCancelNewProfileModal);
