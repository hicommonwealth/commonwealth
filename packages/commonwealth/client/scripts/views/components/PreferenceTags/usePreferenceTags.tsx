import { useState } from 'react';
import { preferenceTags } from './mockedTags';
import { PreferenceTagsHookProps, SelectedTag, Tag } from './types';

const usePreferenceTags = ({
  initialSelectedTag = [],
}: PreferenceTagsHookProps) => {
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>(
    [...preferenceTags].map((item) => ({
      item,
      isSelected: !!initialSelectedTag.find((x) => x.tag === item.tag),
    })),
  );

  const toggleTagFromSelection = (item: Tag, isSelected: boolean) => {
    const updatedTags = [...selectedTags];
    const foundTag = updatedTags.find((t) => t.item.tag === item.tag);
    foundTag.isSelected = isSelected;
    setSelectedTags([...updatedTags]);
  };

  return {
    selectedTags,
    setSelectedTags,
    toggleTagFromSelection,
  };
};

export default usePreferenceTags;
