import moment from 'moment';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDateTimeInput from 'views/components/component_kit/CWDateTimeInput';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import './FiltersDrawer.scss';
import { FiltersDrawerProps } from './types';

export const FiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) => {
  return (
    <div className="FiltersDrawer">
      <CWDrawer
        overlayOpacity={0}
        className="filter-drawer"
        open={isOpen}
        onClose={() => onClose()}
      >
        <CWDrawerTopBar onClose={() => onClose()} />

        <div className="content-container">
          <CWText type="h3">Quest Filters</CWText>
          <div className="filter-content">
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
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};
