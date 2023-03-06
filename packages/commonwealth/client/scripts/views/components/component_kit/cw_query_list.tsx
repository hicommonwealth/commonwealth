import React from 'react';
import type { Components, ItemContent } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import { CWSpinner } from 'views/components/component_kit/cw_spinner';

import 'components/component_kit/cw_query_list.scss';

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
        <CWSpinner />
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
