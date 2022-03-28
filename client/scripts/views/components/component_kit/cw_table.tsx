/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_table.scss';

export enum TableEntryType {
  String = 'string',
  Button = 'button',
  Component = 'other',
}

export type TableAttrs = {
  columns: Array<{ colTitle: string; colWidth: string }>;
  data: Array<{
    value: any;
    type: TableEntryType;
    details?: any;
  }>;
};
export class CWTable implements m.ClassComponent<TableAttrs> {
  view(vnode) {
    console.log(vnode.attrs.data);
    return (
      <table class="Table">
        <tr>
          {vnode.attrs.columns.map(({ colTitle, colWidth }) => {
            return <th style={`width: ${colWidth}`}>{colTitle}</th>;
          })}
        </tr>
        <tr>
          {vnode.attrs.data.map((data) => {
            return <td>{data.value}</td>;
          })}
        </tr>
      </table>
    );
  }
}
