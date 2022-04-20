/* @jsx m */
import m from 'mithril';
import 'components/component_kit/cw_table.scss';
import { CWButton } from './cw_button';
import { ButtonType } from './types';

export enum TableEntryType {
  String = 'string',
  Button = 'button',
  Component = 'other',
}

export type TableEntry = {
  value: any;
  type: TableEntryType;
  align?: string;
  className?: string;
  buttonDetails?: {
    buttonType: ButtonType;
    onclick?: any;
  };
};

export type TableAttrs = {
  columns: Array<{
    colTitle: string;
    collapse: boolean;
    colWidth?: string;
    align?: string;
  }>;
  data: Array<Array<TableEntry>>;
};
export class CWTable implements m.ClassComponent<TableAttrs> {
  private dataMatches: boolean;
  oninit(vnode) {
    this.dataMatches = true;
  }
  view(vnode) {
    for (const data of vnode.attrs.data) {
      if (data.length != vnode.attrs.columns.length) {
        this.dataMatches = false; // Enforce data matches expected columns
      }
    }
    return this.dataMatches ? (
      <table class="Table">
        <tr>
          {vnode.attrs.columns.map(
            ({ colTitle, colWidth, collapse, align }) => {
              return (
                <th
                  class={collapse ? 'table-columns-collapsed' : 'table-columns'}
                  style={
                    (colWidth ? `width: ${colWidth};` : '') +
                    (align ? `text-align: ${align}` : '')
                  }
                >
                  {colTitle}
                </th>
              );
            }
          )}
        </tr>
        {vnode.attrs.data.map((rowData) => {
          return (
            <tr>
              {rowData.map((data, idx) => {
                if (data.type === TableEntryType.String) {
                  return (
                    <td
                      class={
                        data.className
                          ? data.className
                          : vnode.attrs.columns[idx].collapse
                          ? 'collapse-col'
                          : 'normal-col'
                      }
                      style={data.align ? `text-align: ${data.align}` : ''}
                    >
                      {data.value}
                    </td>
                  );
                } else if (data.type === TableEntryType.Button) {
                  return (
                    <td
                      class={
                        data.className
                          ? data.className
                          : vnode.attrs.columns[idx].collapse
                          ? 'collapse-col'
                          : 'normal-col'
                      }
                      style={data.align ? `text-align: ${data.align}` : ''}
                    >
                      <CWButton
                        class={data.className ? data.className : ''}
                        label={data.value}
                        buttonType={data.buttonDetails.buttonType}
                        onclick={data.buttonDetails.onclick}
                      />
                    </td>
                  );
                } else if (data.type === TableEntryType.Component) {
                  // Add styling
                  return (
                    <td
                      class={
                        data.className
                          ? data.className
                          : vnode.attrs.columns[idx].collapse
                          ? 'collapse-col'
                          : 'normal-col'
                      }
                      style={data.align ? `text-align: ${data.align}` : ''}
                    >
                      {data.value}
                    </td>
                  );
                }
              })}
            </tr>
          );
        })}
      </table>
    ) : (
      <div></div>
    );
  }
}
