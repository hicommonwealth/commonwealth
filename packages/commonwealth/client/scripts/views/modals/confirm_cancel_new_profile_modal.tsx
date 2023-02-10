import React from 'react';
import { useNavigate } from 'react-router-dom';

import 'modals/confirm_cancel_new_profile_modal.scss';

import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type ConfirmCancelNewProfileModalProps = {
  closeModal: () => void;
};

const ConfirmCancelNewProfileModal = (
  props: ConfirmCancelNewProfileModalProps
) => {
  const navigate = useNavigate();
  const { closeModal } = props;

  return (
    <div className="ConfirmCancelNewProfileModal">
      <div className="title">
        <CWText type="h4">Are You Sure You Want To Leave?</CWText>
        <CWIconButton iconName="close" onClick={closeModal} />
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
            navigate('/profile/manage');
          }}
        />
      </div>
    </div>
  );
};

export default ConfirmCancelNewProfileModal;
