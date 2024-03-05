import 'components/component_kit/cw_query_list.scss';
import React from 'react';
import type { Components, ItemContent } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import CWCircleMultiplySpinner from './new_designs/CWCircleMultiplySpinner';

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
        <CWCircleMultiplySpinner />
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
