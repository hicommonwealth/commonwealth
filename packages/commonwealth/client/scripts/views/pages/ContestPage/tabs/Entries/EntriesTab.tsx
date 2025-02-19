import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import FarcasterEntriesList from '../../FarcasterEntriesList';
import { SortType } from '../../types';

import './EntriesTab.scss';

interface EntriesTabProps {
  isLoading: boolean;
  entries: any[];
  selectedSort: SortType;
  onSortChange: (sort: SortType) => void;
}

const EntriesTab = ({
  isLoading,
  entries,
  selectedSort,
  onSortChange,
}: EntriesTabProps) => {
  return (
    <div className="EntriesTab">
      <CWText type="h3" fontWeight="semiBold">
        Entries
      </CWText>
      <FarcasterEntriesList
        isLoading={isLoading}
        entries={entries}
        selectedSort={selectedSort}
        onSortChange={onSortChange}
      />
    </div>
  );
};

export default EntriesTab;
