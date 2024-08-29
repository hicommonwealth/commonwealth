import { useEffect, useRef, useState } from 'react';
import { useFetchTagsQuery } from 'state/api/tags';
import { SelectedTag, Tag } from './types';

const usePreferenceTags = () => {
  const isInitialTagsSet = useRef(false);
  const { data: tags, isLoading: isLoadingTags } = useFetchTagsQuery();

  const [preferenceTags, setPreferenceTags] = useState<SelectedTag[]>([]);

  useEffect(() => {
    // @ts-expect-error <StrictNullChecks/>
    if (!isLoadingTags && tags?.length >= 0 && !isInitialTagsSet.current) {
      setPreferenceTags(
        // @ts-expect-error <StrictNullChecks/>
        [...tags].map((item) => ({
          item: {
            id: item.id,
            tag: item.name,
          },
          isSelected: false,
        })),
      );
      isInitialTagsSet.current = true;
    }
  }, [tags, isLoadingTags]);

  const toggleTagFromSelection = (item: Tag, isSelected: boolean) => {
    const updatedTags = [...preferenceTags];
    const foundTag = updatedTags.find((t) => t.item.tag === item.tag);
    // @ts-expect-error <StrictNullChecks/>
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
