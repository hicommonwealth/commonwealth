export type QuestFilters = {
  endingAfter: Date;
  startingBefore?: Date;
};

export type FiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: QuestFilters;
  onFiltersChange: (newFilters: QuestFilters) => void;
};
