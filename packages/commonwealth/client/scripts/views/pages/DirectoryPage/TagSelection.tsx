import React, { useCallback, useState } from 'react';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { usePreferenceTags } from '../../components/PreferenceTags';
import { SelectedTag } from '../../components/PreferenceTags/types';
import DirectorySelectorItem from './DirectorySelectorItem';
import './TagSelection.scss';

const TagSelection = () => {
  const { preferenceTags, setPreferenceTags, toggleTagFromSelection } =
    usePreferenceTags();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTags = preferenceTags.filter((elem) =>
    elem.item.tag.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const renderItem = useCallback(
    (i: number, tag: SelectedTag) => {
      // const isSelected = tag.isSelected;

      return (
        <div>
          <DirectorySelectorItem tagOrCommunityName={tag.item.tag} />
        </div>
      );
    },
    [toggleTagFromSelection],
  );
  // eslint-disable-next-line react/no-multi-comp
  const EmptyComponent = () => (
    <div className="empty-component">
      {searchTerm.length > 0 ? 'No tags found' : 'No tags available'}
    </div>
  );

  return (
    <div className="TagSelection">
      <CWText>How Tag selection works</CWText>
      <CWText>
        Communities with any of the selected tags will appear in the directory.
        If no tags are selected, all communities will be shown.
      </CWText>
      <CWText>Added Tags</CWText>
      <CWText>Available Tags</CWText>

      <CWTextInput
        placeholder="Search for available tags..."
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight={searchTerm ? 'close' : 'magnifyingGlass'}
        onInput={handleInputChange}
      />

      <QueryList
        loading={false}
        options={filteredTags}
        components={{ EmptyPlaceholder: EmptyComponent }}
        renderItem={renderItem}
      />
    </div>
  );
};

export default TagSelection;
