import { CommentsFeaturedFilterTypes } from 'models/types';
import React, { LegacyRef } from 'react';
import { Select } from 'views/components/Select';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import './CommentTree.scss';
import { CommentFiltersProps } from './types';

export const CommentFilters = ({
  commentsRef,
  filters,
  onFiltersChange,
}: CommentFiltersProps) => {
  return (
    <div
      className="comments-filter-row"
      ref={commentsRef as LegacyRef<HTMLDivElement>}
    >
      <Select
        key={filters.sortType}
        size="compact"
        selected={filters.sortType}
        onSelect={(item: {
          label: string;
          value: CommentsFeaturedFilterTypes;
        }) => {
          onFiltersChange({
            ...filters,
            sortType: item.value,
          });
        }}
        options={[
          {
            id: 1,
            value: CommentsFeaturedFilterTypes.Newest,
            label: 'Newest',
            iconLeft: 'sparkle',
          },
          {
            id: 2,
            value: CommentsFeaturedFilterTypes.Oldest,
            label: 'Oldest',
            iconLeft: 'clockCounterClockwise',
          },
          {
            id: 3,
            value: CommentsFeaturedFilterTypes.MostLikes,
            label: 'Upvotes',
            iconLeft: 'upvote',
          },
        ]}
      />
      <CWCheckbox
        checked={filters.includeSpam}
        label="Include comments flagged as spam"
        onChange={(e) => {
          onFiltersChange({
            ...filters,
            includeSpam: e?.target?.checked || false,
          });
        }}
      />
    </div>
  );
};
