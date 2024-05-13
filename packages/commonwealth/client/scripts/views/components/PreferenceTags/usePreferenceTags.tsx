import { useFetchTagsQuery } from 'client/scripts/state/api/tags';
import { useEffect, useRef, useState } from 'react';
import { PreferenceTagsHookProps, SelectedTag, Tag } from './types';

const usePreferenceTags = ({
  initialSelectedTag = [],
}: PreferenceTagsHookProps) => {
  const isInitialTagsSet = useRef(false);
  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const [preferenceTags, setPreferenceTags] = useState<SelectedTag[]>([]);

  useEffect(() => {
    if (!isLoadingTags && tags?.length >= 0 && !isInitialTagsSet.current) {
      setPreferenceTags(
        [...tags].map((item) => ({
          item: {
            id: item.id,
            tag: item.name,
          },
          isSelected: !!initialSelectedTag.find((x) => x.tag === item.name),
        })),
      );
      isInitialTagsSet.current = true;
    }
  }, [tags, isLoadingTags, initialSelectedTag]);

  const toggleTagFromSelection = (item: Tag, isSelected: boolean) => {
    const updatedTags = [...preferenceTags];
    const foundTag = updatedTags.find((t) => t.item.tag === item.tag);
    foundTag.isSelected = isSelected;
    setPreferenceTags([...updatedTags]);
  };

  return {
    isLoadingTags,
    preferenceTags,
    setPreferenceTags,
    toggleTagFromSelection,
  };
};

export default usePreferenceTags;
