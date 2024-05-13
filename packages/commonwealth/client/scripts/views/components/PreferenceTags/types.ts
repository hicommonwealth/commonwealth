export type Tag = {
  id: number;
  tag: string;
};

export type SelectedTag = {
  isSelected: boolean;
  item: Tag;
};

export type PreferenceTagsProps = {
  preferenceTags: SelectedTag[];
  onTagClick: (tag: Tag, isSelected: boolean) => void;
  containerClassName?: string;
  maxSelectableTags?: number;
};

export type PreferenceTagsHookProps = {
  initialSelectedTag?: Tag[];
};
