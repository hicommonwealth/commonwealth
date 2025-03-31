import React, { useCallback, useState } from 'react';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { usePreferenceTags } from '../../components/PreferenceTags';
import { SelectedTag } from '../../components/PreferenceTags/types';
import DirectorySelectorItem from './DirectorySelectorItem';
import './TagsAndManualSelection.scss';

type TagSelectionProps = {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
};

const TagSelection = ({
  selectedTags = [],
  setSelectedTags,
}: TagSelectionProps) => {
  const { preferenceTags } = usePreferenceTags();
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

  const handleTagClick = useCallback(
    (tagName: string) => {
      const newTags = selectedTags.includes(tagName)
        ? selectedTags.filter((t) => t !== tagName)
        : [...selectedTags, tagName];

      setSelectedTags(newTags);
    },
    [selectedTags, setSelectedTags],
  );

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  const renderItem = useCallback(
    (i: number, tag: SelectedTag) => {
      const isSelected = selectedTags.includes(tag.item.tag);

      return (
        <div>
          <DirectorySelectorItem
            tagOrCommunityName={tag.item.tag}
            isSelected={isSelected}
            onChange={() => handleTagClick(tag.item.tag)}
          />
        </div>
      );
    },
    [selectedTags, handleTagClick],
  );

  // eslint-disable-next-line react/no-multi-comp
  const EmptyComponent = () => (
    <div className="empty-component">
      {searchTerm.length > 0 ? 'No tags found' : 'No tags available'}
    </div>
  );

  return (
    <div className="TagsAndManualSelection">
      <CWText fontWeight="medium">How Tag selection works</CWText>
      <CWText>
        Communities with any of the selected tags will appear in the directory.
        If no tags are selected, all communities will be shown.
      </CWText>
      {selectedTags.length > 0 && (
        <CWText className="added-text" fontWeight="medium">
          Added Tags
        </CWText>
      )}

      <div className="selected-tags">
        {selectedTags.map((tag) => (
          <CWTag
            key={tag}
            label={tag}
            type="filter"
            onCloseClick={() => handleTagRemove(tag)}
          />
        ))}
      </div>

      <CWText className="available-text" fontWeight="medium">
        Available Tags
      </CWText>

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
