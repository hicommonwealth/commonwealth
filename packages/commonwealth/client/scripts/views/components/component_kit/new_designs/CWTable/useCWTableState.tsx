import { useCallback, useMemo, useState } from 'react';
import { CWTableColumnInfo, CWTableSorting } from './CWTable';

type UseCWTableStateProps = {
  columns: CWTableColumnInfo[];
  initialSortColumn?: string;
  initialSortDirection: 'ASC' | 'DESC';
};

export type CWTableState = {
  columns: CWTableColumnInfo[];
  orderBy: string;
  orderDirection: string;
  sorting: CWTableSorting;
  setSorting: (newSorting: CWTableSorting) => void;
  toggleSortDirection: (column: string) => void;
};

export function useCWTableState({
  columns,
  initialSortColumn,
  initialSortDirection,
}: UseCWTableStateProps): CWTableState {
  // used for CWTable sorting
  const [sorting, setSorting] = useState<CWTableSorting>([
    {
      id: initialSortColumn as string,
      desc: initialSortDirection === 'DESC',
    },
  ]);

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

  const toggleSortDirection = useCallback(
    (column) => {
      const newSorting = sorting.map((sortState) =>
        sortState.id === column
          ? { ...sortState, desc: !sortState.desc }
          : sortState,
      );
      setSorting(newSorting);
    },
    [sorting, setSorting],
  );

  return {
    columns,
    orderBy,
    orderDirection,
    sorting,
    setSorting,
    toggleSortDirection,
  };
}
