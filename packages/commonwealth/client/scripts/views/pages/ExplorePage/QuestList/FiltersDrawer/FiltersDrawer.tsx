import { CommonFiltersDrawer } from 'client/scripts/views/components/CommonFiltersDrawer/CommonFiltersDrawer';
import moment from 'moment';
import React from 'react';
import CWDateTimeInput from 'views/components/component_kit/CWDateTimeInput';
import './FiltersDrawer.scss';
import { FiltersDrawerProps } from './types';

export const FiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) => {
  return (
    <CommonFiltersDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Quest Filters"
    >
      <CWDateTimeInput
        label="Ending After"
        selected={moment(filters.endingAfter).utc().local().toDate()}
        onChange={(date) =>
          date && onFiltersChange({ ...filters, endingAfter: date })
        }
        fullWidth
        showTimeSelect
      />
      <CWDateTimeInput
        label="Starting Before"
        selected={moment(filters.startingBefore).utc().local().toDate()}
        onChange={(date) =>
          date && onFiltersChange({ ...filters, startingBefore: date })
        }
        fullWidth
        showTimeSelect
      />
    </CommonFiltersDrawer>
  );
};
