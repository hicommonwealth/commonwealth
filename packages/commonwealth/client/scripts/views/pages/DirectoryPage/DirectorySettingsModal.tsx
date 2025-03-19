import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';

interface DirectorySettingsModalProps {
  onModalClose: () => void;
}

const DirectorySettingsModal = ({
  onModalClose,
}: DirectorySettingsModalProps) => {
  return (
    <div className="DirectorySettingsModal">
      <CWModalHeader label="Directory Settings" onModalClose={onModalClose} />
      <CWText></CWText>
      <CWModalBody>
        <CWText>
          Configure which communities appear in the directory through tags or
          manual selection.
        </CWText>
        <CWText>TOGGLE GOES HERE</CWText>
        <CWText>Tag/Manual Selection GOES HERE</CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          buttonHeight="sm"
          onClick={() => onModalClose()}
          label="Cancel"
          buttonType="secondary"
        />
        <CWButton
          buttonHeight="sm"
          onClick={() => console.log('SAVE CHANGES')}
          label="Save Changes"
          buttonType="primary"
        />
      </CWModalFooter>
    </div>
  );
};

export default DirectorySettingsModal;
