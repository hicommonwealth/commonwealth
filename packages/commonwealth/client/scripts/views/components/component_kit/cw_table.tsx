import faker from 'faker';
import React from 'react'
import { CWIcon } from './cw_icons/cw_icon';
import 'components/component_kit/cw_table.scss';
import { CWIconButton } from './cw_icon_button';
import ReactDOM from 'react-dom/client'
import { CWTag } from './cw_tag';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'

type ColumnDescriptor = {
  key: string;
  header: string;
  numeric: boolean;
}

type TableProps = {
  columnInfo: ColumnDescriptor[];
  rowData: [];
};

export const CWTable = ({ columnInfo, rowData }) => {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns = React.useMemo<ColumnDef<unknown, any>[]>(
    () =>
      columnInfo.map((col) => {
        return (
          {
            accessorKey: col.key,
            header: col.header,
            cell: (info) => {
              if (col.numeric) {
                return (
                  <div className='numeric'>
                    {info.getValue()}
                  </div>
                )
              } else {
                return info.getValue()
              }
            },
            footer: props => props.column.id,
          }
        )
      }),
    []
  )

  const [data, setData] = React.useState(() => rowData)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  })

  return (
    <div className="Table">
      <div className="h-2" />
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className:`header-content ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`,
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        <span className='header-text'>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>

                        {{
                          asc: <div className='icon-container'><CWIcon
                                 iconName='arrowUpBlue500'
                                 iconSize='small'
                                 className='arrow-up-blue'
                                /></div>,
                          desc: <div className='icon-container'><CWIcon 
                                  iconName='arrowDownBlue500'
                                  iconSize='small'
                                  className='arrow-down-blue'
                                  /></div>,
                          false: <div className='icon-container'><CWIcon
                                   iconName='arrowUpNeutral400'
                                   iconSize='small'
                                   className='arrow-down-blue'
                                  /></div>,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table
            .getRowModel()
            .rows.slice(0, 10)
            .map(row => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => {
                    return (
                      <td key={cell.id} className='data-container'>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
