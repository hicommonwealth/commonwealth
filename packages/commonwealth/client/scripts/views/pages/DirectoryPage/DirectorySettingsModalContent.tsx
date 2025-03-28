import React from 'react';
import './DirectorySettingsModalContent.scss';
import ManualSelection from './ManualSelection';
import TagSelection from './TagSelection';

type DirectorySettingsModalContentProps = {
  activeDirectoryTab: string;
  filteredRelatedCommunitiesData: any;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedCommunities: string[];
  setSelectedCommunities: (communities: string[]) => void;
};

const DirectorySettingsModalContent = ({
  activeDirectoryTab,
  filteredRelatedCommunitiesData,
  selectedTags,
  setSelectedTags,
  selectedCommunities,
  setSelectedCommunities,
}: DirectorySettingsModalContentProps) => {
  if (activeDirectoryTab === 'TagSelection') {
    return (
      <div className="DirectorySettingsModalContent">
        <TagSelection
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
      </div>
    );
  }
  if (activeDirectoryTab === 'ManualSelection') {
    return (
      <div className="DirectorySettingsModalContent">
        <ManualSelection
          filteredRelatedCommunitiesData={filteredRelatedCommunitiesData}
          selectedCommunities={selectedCommunities}
          setSelectedCommunities={setSelectedCommunities}
        />
      </div>
    );
  }
};

export default DirectorySettingsModalContent;
