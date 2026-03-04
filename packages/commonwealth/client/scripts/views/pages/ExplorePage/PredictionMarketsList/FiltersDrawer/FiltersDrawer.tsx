import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import CWAccordion from 'views/components/CWAccordion';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import type {
  FiltersDrawerProps,
  PredictionMarketStatusFilter,
} from './types';
import './FiltersDrawer.scss';

const STATUS_OPTIONS: { value: PredictionMarketStatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'recency', label: 'Recency' },
  { value: 'volume', label: 'Volume' },
] as const;

export const FiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) => {
  return (
    <div className="PredictionMarketsFiltersDrawer">
      <CWDrawer
        overlayOpacity={0}
        className="filter-drawer"
        open={isOpen}
        onClose={() => onClose()}
      >
        <CWDrawerTopBar onClose={() => onClose()} />

        <div className="content-container">
          <CWText type="h3">Prediction market filters</CWText>
          <div className="filter-content">
            <CWAccordion
              header="Status"
              content={
                <div className="options-list">
                  {STATUS_OPTIONS.map((opt) => (
                    <CWCheckbox
                      key={opt.value}
                      label={opt.label}
                      checked={filters.statuses.includes(opt.value)}
                      onChange={() => {
                        const next = filters.statuses.includes(opt.value)
                          ? filters.statuses.filter((s) => s !== opt.value)
                          : [...filters.statuses, opt.value];
                        onFiltersChange({
                          ...filters,
                          statuses: next,
                        });
                      }}
                    />
                  ))}
                </div>
              }
            />
            <CWAccordion
              header="Sort by"
              content={
                <div className="options-list">
                  {SORT_OPTIONS.map((opt) => (
                    <CWRadioButton
                      key={opt.value}
                      groupName="pm-sort"
                      value={opt.value}
                      label={opt.label}
                      checked={filters.sort === opt.value}
                      onChange={() =>
                        onFiltersChange({
                          ...filters,
                          sort: opt.value,
                        })
                      }
                    />
                  ))}
                </div>
              }
            />
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};
