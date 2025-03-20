import React from 'react';
import ManualSelection from './ManualSelection';
import TagSelection from './TagSelection';

type DirectorySettingsModalContentProps = {
  activeDirectoryTab: string;
  filteredRelatedCommunitiesData: any;
};

const DirectorySettingsModalContent = ({
  activeDirectoryTab,
  filteredRelatedCommunitiesData,
}: DirectorySettingsModalContentProps) => {
  if (activeDirectoryTab === 'TagSelection') {
    return <TagSelection />;
  }
  if (activeDirectoryTab === 'ManualSelection') {
    return (
      <ManualSelection
        filteredRelatedCommunitiesData={filteredRelatedCommunitiesData}
      />
    );
  }
};

export default DirectorySettingsModalContent;
