import React from 'react';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import './FiltersDrawer.scss';

export interface ThreadFilters {
  in_community_id?: string;
}

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ThreadFilters;
  onFiltersChange: (filters: ThreadFilters) => void;
}

export const FiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) => {
  const user = useUserStore();
  const communities =
    user.communities?.map((community) => ({
      label: community.name,
      value: community.id,
    })) || [];
  const selected = communities.find((x) => x.value === filters.in_community_id);

  return (
    <div className="FiltersDrawer">
      <CWDrawer
        overlayOpacity={0}
        className="filter-drawer"
        open={isOpen}
        onClose={onClose}
      >
        <CWDrawerTopBar onClose={onClose} />

        <div className="content-container">
          <CWText type="h3">Thread Filters</CWText>
          <div className="filter-content">
            {user.id ? (
              <CWSelectList
                label="Community"
                placeholder="Select a community"
                options={communities}
                {...(selected && {
                  selected,
                })}
                onChange={(newValue) =>
                  newValue &&
                  onFiltersChange({
                    ...filters,
                    in_community_id: newValue.value,
                  })
                }
              />
            ) : (
              <div className="login-message">
                <CWText>Login to filter by community</CWText>
              </div>
            )}
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};
