import React from 'react';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './AppliedFiltersAndTagsRow.scss';

interface AppliedFiltersAndTagsRowProps {
  onCloseClick: () => void;
  appliedFilters: Array<{ label: string; value: string }>;
  onRemoveFilter: (filter: { label: string; value: string }) => void;
}

const AppliedFiltersAndTagsRow = ({
  onCloseClick,
  appliedFilters,
  onRemoveFilter,
}: AppliedFiltersAndTagsRowProps) => {
  return (
    <div className="AppliedFiltersAndTagsRow">
      {appliedFilters.map((filter) => (
        <CWTag
          key={filter.value}
          classNames="applied-filter-button"
          label={filter.label}
          type="filter"
          onCloseClick={() => onRemoveFilter(filter)}
        />
      ))}
      {appliedFilters.length > 0 && (
        <CWTag
          classNames="applied-filter-button"
          label="Clear all"
          type="filter"
          onCloseClick={onCloseClick}
        />
      )}
    </div>
  );
};

export default AppliedFiltersAndTagsRow;
