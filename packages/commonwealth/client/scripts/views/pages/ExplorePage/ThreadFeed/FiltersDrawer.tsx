import React from 'react';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { z } from 'zod';

export const ThreadFiltersSchema = z.object({
  in_community_id: z.string().optional(),
});

export type ThreadFilters = z.infer<typeof ThreadFiltersSchema>;

type FiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: ThreadFilters;
  onFiltersChange: (filters: ThreadFilters) => void;
};

const FiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) => {
  const user = useUserStore();
  const userCommunities = user.communities || [];
  const options = userCommunities.map((community) => ({
    label: community.name,
    value: community.id,
  }));
  const currentOption = options.find(
    (o) => o.value === filters.in_community_id,
  );

  const handleCommunityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      in_community_id: value,
    });
  };

  return (
    <CWModal
      size="small"
      content={
        <div className="FiltersDrawer">
          <CWText type="h4">Filters</CWText>
          <div className="filter-section">
            <CWText type="h5">Community</CWText>
            <CWSelectList
              options={options}
              {...(currentOption && {
                value: currentOption,
              })}
              onChange={(newValue) =>
                handleCommunityChange(newValue?.value || '')
              }
            />
          </div>
          <div className="filter-actions">
            <CWButton label="Apply" buttonType="primary" onClick={onClose} />
          </div>
        </div>
      }
      onClose={onClose}
      open={isOpen}
    />
  );
};

export default FiltersDrawer;
