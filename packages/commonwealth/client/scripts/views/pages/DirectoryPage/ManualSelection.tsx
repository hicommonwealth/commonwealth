import React, { useCallback, useEffect, useState } from 'react';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import DirectorySelectorItem from './DirectorySelectorItem';
import './TagsAndManualSelection.scss';

type ManualSelectionProps = {
  filteredRelatedCommunitiesData: any;
  selectedCommunities: string[];
  setSelectedCommunities: (communities: string[]) => void;
};

const ManualSelection = ({
  filteredRelatedCommunitiesData,
  selectedCommunities,
  setSelectedCommunities,
}: ManualSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedCommunities, setLocalSelectedCommunities] = useState<
    string[]
  >([]);

  useEffect(() => {
    setLocalSelectedCommunities(selectedCommunities);
  }, [selectedCommunities]);

  const filteredCommunities = filteredRelatedCommunitiesData.filter((elem) =>
    elem.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCommunityClick = useCallback(
    (community: any) => {
      console.log('Selected community data:', community);
      const newCommunities = localSelectedCommunities.includes(community.id)
        ? localSelectedCommunities.filter((c) => c !== community.id)
        : [...localSelectedCommunities, community.id];
      setLocalSelectedCommunities(newCommunities);
      setSelectedCommunities(newCommunities);
    },
    [localSelectedCommunities, setSelectedCommunities],
  );

  const handleCommunityRemove = (communityName: string) => {
    const newCommunities = localSelectedCommunities.filter(
      (c) => c !== communityName,
    );
    setLocalSelectedCommunities(newCommunities);
    setSelectedCommunities(newCommunities);
  };

  const renderItem = useCallback(
    (i: number, community: any) => {
      const isSelected = localSelectedCommunities.includes(community.id);

      return (
        <div>
          <DirectorySelectorItem
            tagOrCommunityName={community.name}
            communityIcon={community.iconUrl}
            isSelected={isSelected}
            onChange={() => handleCommunityClick(community)}
          />
        </div>
      );
    },
    [localSelectedCommunities, handleCommunityClick],
  );

  // eslint-disable-next-line react/no-multi-comp
  const EmptyComponent = () => (
    <div className="empty-component">
      {searchTerm.length > 0
        ? 'No communities found'
        : 'No Communities available'}
    </div>
  );

  return (
    <div className="TagsAndManualSelection">
      <div className="selected-items">
        <CWText fontWeight="medium">How Manual Selection works</CWText>
        <CWText>
          Search for specific communities to add to the directory - members can
          see them regardless of their tags.
        </CWText>

        <CWText className="available-text" fontWeight="medium">
          Available Communities
        </CWText>
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
    </div>
  );
};

export default ManualSelection;
