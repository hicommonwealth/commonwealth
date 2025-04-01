import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWTab from '../../components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from '../../components/component_kit/new_designs/CWTabs/CWTabsRow';
import './DirectorySettingsDrawer.scss';
import ManualSelection from './ManualSelection';
import TagSelection from './TagSelection';

enum DirectoryDrawerTabsType {
  TagSelectionType = 'TagSelection',
  ManualSelectionType = 'ManualSelection',
}

type DirectorySettingsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filteredRelatedCommunitiesData: any;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedCommunities: string[];
  setSelectedCommunities: (communities: string[]) => void;
  handleSaveChanges: () => void;
};

const DirectorySettingsDrawer = ({
  isOpen,
  onClose,
  filteredRelatedCommunitiesData,
  selectedTags,
  setSelectedTags,
  selectedCommunities,
  setSelectedCommunities,
  handleSaveChanges,
}: DirectorySettingsDrawerProps) => {
  const [activeDirectoryDrawerTab, setActiveDirectoryDrawerTab] =
    useState('TagSelection');

  return (
    <div className="DirectorySettingsDrawer">
      <CWDrawer
        className="directory-settings-drawer"
        open={isOpen}
        overlayOpacity={0}
        onClose={() => onClose()}
      >
        <CWDrawerTopBar onClose={() => onClose()} />
        <div className="content-container">
          <CWText>Directory Settings</CWText>
          <CWTabsRow className="explore-tabs-row">
            <CWTab
              label="Tag Selection"
              isSelected={
                activeDirectoryDrawerTab ===
                DirectoryDrawerTabsType.TagSelectionType
              }
              onClick={() =>
                setActiveDirectoryDrawerTab(
                  DirectoryDrawerTabsType.TagSelectionType,
                )
              }
            />
            <CWTab
              label="Manual Selection"
              isSelected={
                activeDirectoryDrawerTab ===
                DirectoryDrawerTabsType.ManualSelectionType
              }
              onClick={() =>
                setActiveDirectoryDrawerTab(
                  DirectoryDrawerTabsType.ManualSelectionType,
                )
              }
            />
          </CWTabsRow>
          <div>
            {activeDirectoryDrawerTab === 'TagSelection' ? (
              <div className="tag-selection">
                <TagSelection
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                />
              </div>
            ) : (
              <div className="manual-selection">
                <ManualSelection
                  filteredRelatedCommunitiesData={
                    filteredRelatedCommunitiesData
                  }
                  selectedCommunities={selectedCommunities}
                  setSelectedCommunities={setSelectedCommunities}
                />
              </div>
            )}
          </div>
          <div className="drawer-buttons">
            <CWButton
              buttonHeight="sm"
              onClick={() => onClose()}
              label="Cancel"
              buttonType="secondary"
            />
            <CWButton
              buttonHeight="sm"
              type="submit"
              label="Save Changes"
              buttonType="primary"
              onClick={handleSaveChanges}
            />
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};

export default DirectorySettingsDrawer;
