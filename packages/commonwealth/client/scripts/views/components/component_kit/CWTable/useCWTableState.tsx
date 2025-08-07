import { APIOrderDirection } from 'helpers/constants';
import { useMemo, useState } from 'react';
import { CWTableColumnInfo, CWTableSorting } from './CWTable';

type UseCWTableStateProps = {
  columns: CWTableColumnInfo[];
  initialSortColumn?: string;
  initialSortDirection: APIOrderDirection;
};

export type CWTableState = {
  columns: CWTableColumnInfo[];
  orderBy: string;
  orderDirection: string;
  sorting: CWTableSorting;
  setSorting: (newSorting: CWTableSorting) => void;
};

export function useCWTableState({
  columns,
  initialSortColumn,
  initialSortDirection,
}: UseCWTableStateProps): CWTableState {
  // used for CWTable sorting
  const [sorting, setSorting] = useState<CWTableSorting>(
    initialSortColumn
      ? [
          {
            id: initialSortColumn as string,
            desc: initialSortDirection === 'DESC',
          },
        ]
      : [],
  );

  // used for API calls
  const { orderBy, orderDirection } = useMemo(() => {
    if (sorting.length === 0) {
      return {
        orderBy: initialSortColumn,
        orderDirection: initialSortDirection,
      };
    }
    return {
      orderBy: sorting[0].id,
      orderDirection: sorting[0].desc ? 'DESC' : 'ASC',
    };
  }, [sorting, initialSortColumn, initialSortDirection]);

  return {
    columns,
    // @ts-expect-error <StrictNullChecks/>
    orderBy,
    orderDirection,
    sorting,
    setSorting,
  };
}
