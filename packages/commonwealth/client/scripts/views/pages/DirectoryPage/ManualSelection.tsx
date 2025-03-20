import React, { useCallback, useState } from 'react';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import DirectorySelectorItem from './DirectorySelectorItem';
import './ManualSelection.scss';

type ManualSelectionProps = {
  filteredRelatedCommunitiesData: any;
};

const ManualSelection = ({
  filteredRelatedCommunitiesData,
}: ManualSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCommunities = filteredRelatedCommunitiesData.filter((elem) =>
    elem.id.includes(searchTerm.toLowerCase()),
  );

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const renderItem = useCallback((i: number, community: any) => {
    return (
      <div>
        <DirectorySelectorItem
          tagOrCommunityName={community.name}
          communityIcon={community.iconUrl}
        />
      </div>
    );
  }, []);

  // eslint-disable-next-line react/no-multi-comp
  const EmptyComponent = () => (
    <div className="empty-component">
      {searchTerm.length > 0
        ? 'No communities found'
        : 'No Communities available'}
    </div>
  );

  return (
    <div className="ManualSelection">
      <CWText>How Manual Selection works</CWText>
      <CWText>
        Search for specific communities to add to the directory - members can
        see them regardless of their tags.
      </CWText>
      <CWText>Added Communities</CWText>
      <CWText>Available Communities</CWText>
      <CWTextInput
        placeholder="Search communities on Common..."
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight={searchTerm ? 'close' : 'magnifyingGlass'}
        onInput={handleInputChange}
      />

      <QueryList
        loading={false}
        options={filteredCommunities}
        components={{ EmptyPlaceholder: EmptyComponent }}
        renderItem={renderItem}
      />
    </div>
  );
};

export default ManualSelection;
