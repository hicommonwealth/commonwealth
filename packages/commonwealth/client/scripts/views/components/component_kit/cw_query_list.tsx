import 'components/component_kit/cw_query_list.scss';
import React from 'react';
import type { Components, ItemContent } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import CWLoadingSpinner from './new_designs/CWLoadingSpinner';

interface QueryListProps<ListItem> {
  loading: boolean;
  options: ListItem[];
  components?: Components;
  renderItem: ItemContent<ListItem, any>;
}

export const QueryList = <T,>({
  loading,
  options,
  components,
  renderItem,
}: QueryListProps<T>) => {
  return (
    <div className="QueryList">
      {loading ? (
        <CWLoadingSpinner />
      ) : (
        <Virtuoso
          data={options}
          {...(components ? { components } : {})}
          itemContent={renderItem}
        />
      )}
    </div>
  );
};
