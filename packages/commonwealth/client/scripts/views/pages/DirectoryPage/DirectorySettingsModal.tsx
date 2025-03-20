import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import CWTab from '../../components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from '../../components/component_kit/new_designs/CWTabs/CWTabsRow';
import './DirectorySettingsModal.scss';
import DirectorySettingsModalContent from './DirectorySettingsModalContent';

enum DirectoryTabsType {
  TagSelection = 'TagSelection',
  ManualSelection = 'ManualSelection',
}

type DirectorySettingsModalProps = {
  onModalClose: () => void;
  filteredRelatedCommunitiesData: any;
};

const DirectorySettingsModal = ({
  onModalClose,
  filteredRelatedCommunitiesData,
}: DirectorySettingsModalProps) => {
  const [activeDirectoryTab, setActiveDirectoryTab] = useState(
    DirectoryTabsType.TagSelection,
  );

  return (
    <div className="DirectorySettingsModal">
      <CWModalHeader label="Directory Settings" onModalClose={onModalClose} />
      <CWText></CWText>
      <CWModalBody>
        <CWText>
          Configure which communities appear in the directory through tags or
          manual selection.
        </CWText>
        <CWTabsRow className="explore-tabs-row">
          <CWTab
            label="Tag Selection"
            isSelected={activeDirectoryTab === DirectoryTabsType.TagSelection}
            onClick={() =>
              setActiveDirectoryTab(DirectoryTabsType.TagSelection)
            }
          />
          <CWTab
            label="Manual Selection"
            isSelected={
              activeDirectoryTab === DirectoryTabsType.ManualSelection
            }
            onClick={() =>
              setActiveDirectoryTab(DirectoryTabsType.ManualSelection)
            }
          />
        </CWTabsRow>
        <DirectorySettingsModalContent
          filteredRelatedCommunitiesData={filteredRelatedCommunitiesData}
          activeDirectoryTab={activeDirectoryTab}
        />
        {/* <CWText>Tag/Manual Selection GOES HERE</CWText> */}
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
