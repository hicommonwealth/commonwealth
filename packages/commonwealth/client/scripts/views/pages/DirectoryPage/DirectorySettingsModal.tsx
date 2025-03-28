import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { MixpanelCommunityInteractionEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
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
  filteredRelatedCommunitiesData: any;
  onModalClose: () => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedCommunities: string[];
  setSelectedCommunities: (communities: string[]) => void;
};

const DirectorySettingsModal = ({
  filteredRelatedCommunitiesData,
  onModalClose,
  selectedTags,
  setSelectedTags,
  selectedCommunities,
  setSelectedCommunities,
}: DirectorySettingsModalProps) => {
  const [activeDirectoryTab, setActiveDirectoryTab] = useState('TagSelection');
  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelCommunityInteractionEvent.DIRECTORY_SETTINGS_CHANGED,
      isPWA: isAddedToHomeScreen,
    },
  });

  const handleSubmit = async () => {
    //mutation call to update the directory settings goes here
    onModalClose();
    trackAnalytics({
      event: MixpanelCommunityInteractionEvent.DIRECTORY_SETTINGS_CHANGED,
      isPWA: isAddedToHomeScreen,
    });
  };

  return (
    <div className="DirectorySettingsModal">
      <CWModalHeader label="Directory Settings" onModalClose={onModalClose} />
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
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedCommunities={selectedCommunities}
          setSelectedCommunities={setSelectedCommunities}
        />
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
          type="submit"
          label="Save Changes"
          buttonType="primary"
        />
      </CWModalFooter>
    </div>
  );
};

export default DirectorySettingsModal;
