/*
Using the CWTable Component

To view the table component, please visit the components showcase at path '/components'.

CWTable expects two pieces of information: information describing the columns (columnInfo) and the
actual data to be displayed (rowData). These are to be passed in a data structure that looks like so:

{
  columnInfo: [
    {
      key: 'name',
      header: 'Company Name',
      numeric: false,
      sortable: true
    },
    {
      key: 'emp_count',
      header: 'No. of Employees',
      numeric: true,
      sortable: true
    },
  ],
  rowData: [
    {
      name: 'Stark Industries',
      emp_count: 1000,
      avatars: {
        name: {
          avatarUrl: 'https://assets.commonwealth.im/f5c5a0c6-0552-40be-bb4b-b25fbd0cfbe2.png',
          address: null,
        },
      },
    },
    {
      name: 'Cyberdyne Systems',
      emp_count: 10000,
      avatars: {
        name: {
          avatarUrl: null,
          address: '0x123abc',
        },
      },
    },
  ]
}

The columnInfo array is an array of the columns the table will have in the order in which they will appear in the
table's header. One important thing to note is that, by default, the table data is sorted (in ascending order) by
the first column provided to columnInfo.

Objects in the columnInfo array must have 4 keys: `key`, `header`, `numeric`, and `sortable`.

`key` is a string that must match a key in the rowData objects to which the column corresponds. Let's
say you have a table consisting of rows of company data. If you would like a column that
displays the data with the key 'name', you specify it here.

`header` is a string that is the actual label you would like to display in the header, which does
not have to match the key.

`numeric` is a boolean describing whether the data is numeric or not (data is displayed differently
  depending on whether it's numeric). Provide `false` if the data is non-numeric. Otherwise, provide `true`.

`sortable` is a boolean describing whether you would like the column to be sortable. If you pass `false`, no arrow
will be displayed near the label for this column and sorting will be disabled. Note that if you are passing data
that is not a string, number, or date, sorting won't actually work (i.e. items will be re-ordered, but in a mysterious
way), even if you set the `sortable` attribute to true. However, the arrow will be there, which makes for a terrble
user experience. Be certain that the column's data can be sorted before designating it as sortable.

The rowData array has no required keys on the objects within it. However, if any of your columns have data that is
displayed along with an avatar, you'll need to make use of the `avatars` object. `avatars` is an object with keys
that correspond to keys in the data that have avatars. For instance, if you would like to display the logo of
Stark Industries next to the name 'Stark Industries', insert a key-value pair into the `avatars`
object where the key matches the associated key in the data and the value is an object containing
 the URL or address where the avatar can be found (see above data structure).
*/

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { getRelativeTimestamp } from 'client/scripts/helpers/dates';
import clsx from 'clsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '../../../Avatar';
import { CWIcon } from '../../cw_icons/cw_icon';
import { ComponentType } from '../../types';
import './CWTable.scss';

type ColumnDescriptor = {
  key: string;
  header: string;
  numeric: boolean;
  sortable: boolean;
  chronological?: boolean;
  customElementKey?: string;
  hasCustomSortValue?: boolean;
};

type RowData = {
  avatars?: object;
};

type TableProps = {
  columnInfo: ColumnDescriptor[];
  rowData: any[];
  isLoadingMoreRows?: boolean;
  onScrollEnd?: () => any;
  defaultSortColumnKey?: string;
  defaultSortDesc?: boolean;
};

export const CWTable = ({
  columnInfo,
  rowData,
  onScrollEnd,
  isLoadingMoreRows,
  defaultSortColumnKey = columnInfo[0].key,
  defaultSortDesc = true,
}: TableProps) => {
  const tableRef = useRef();
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: defaultSortColumnKey,
      desc: defaultSortDesc,
    },
  ]);

  const columns = useMemo<ColumnDef<unknown, any>[]>(
    () =>
      columnInfo.map((col) => {
        return {
          accessorKey: col.key,
          header: col.header,
          ...(col?.hasCustomSortValue && {
            // implement custom sorting function, if we have custom sorting value.
            sortingFn: (rowA, rowB, columnId) => {
              return rowA.original[columnId].sortValue <
                rowB.original[columnId].sortValue
                ? 1
                : -1;
            },
          }),
          cell: (info) => {
            const currentRow = info.row.original as RowData;
            const avatarInfo = currentRow.avatars?.[col.key];
            const avatarUrl = avatarInfo?.avatarUrl;
            const avatarAddress = avatarInfo?.address;

            if (currentRow[col.key]?.customElement) {
              return currentRow[col.key].customElement;
            }

            if (col.customElementKey) {
              return currentRow[col.customElementKey];
            }

            const numericColVal = col.chronological
              ? info.getValue()
                ? getRelativeTimestamp(info.getValue())
                : 'N/A'
              : info.getValue();

            if (col.numeric) {
              return <div className="numeric">{numericColVal}</div>;
            }

            if (avatarUrl || avatarAddress) {
              return (
                <div className="avatar-cell">
                  <Avatar url={avatarUrl} address={avatarAddress} size={20} />
                  <div className="text">{info.getValue()}</div>
                </div>
              );
            }

            return info.getValue();
          },
          footer: (footerProps) => footerProps.column.id,
          enableSorting: col.sortable,
          isNumeric: col.numeric,
        };
      }),
    [columnInfo],
  );

  const table = useReactTable({
    data: rowData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const displaySortIcon = (
    sortDirection: string,
    sortHandler: (event: unknown) => void,
  ) => {
    const sortDirections = {
      asc: (
        <div className="icon-container">
          <CWIcon
            iconName="arrowUpBlue500"
            iconSize="small"
            className="arrow-up-blue"
            onClick={sortHandler}
          />
        </div>
      ),
      desc: (
        <div className="icon-container">
          <CWIcon
            iconName="arrowDownBlue500"
            iconSize="small"
            className="arrow-down-blue"
            onClick={sortHandler}
          />
        </div>
      ),
      false: (
        <div className="icon-container">
          <CWIcon
            iconName="arrowUpNeutral400"
            iconSize="small"
            className="arrow-down-blue"
            onClick={sortHandler}
          />
        </div>
      ),
    };

    return sortDirections[sortDirection];
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMoreRows) {
        onScrollEnd?.();
      }
    });

    if (tableRef.current) {
      observer.observe(tableRef.current);
    }

    return () => {
      observer?.disconnect();
    };
  }, [isLoadingMoreRows, tableRef, onScrollEnd]);

  return (
    <div className={ComponentType.Table}>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: clsx(
                            'header-content',
                            header.column.getCanSort() &&
                              'cursor-pointer select-none',
                            {
                              numeric: (header.column.columnDef as any)
                                .isNumeric,
                            },
                          ),
                        }}
                      >
                        <span className="header-text">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>

                        {header.column.getCanSort()
                          ? displaySortIcon(
                              header.column.getIsSorted() as string,
                              header.column.getToggleSortingHandler(),
                            ) ?? null
                          : null}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id} className="data-container">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <div ref={tableRef} style={{ height: '1px' }}></div>
      </table>
    </div>
  );
};
