/* @jsx m */

import m, { Vnode } from 'mithril';
import 'components/component_kit/cw_table.scss';

export type ButtonAttrs = {
  className?: string;
  tableName?: string;
  headers: string[] | Vnode<never>[];
  entries: Vnode<never>[][];
};

// Only styled for simple two-column table
export class CWTable implements m.ClassComponent<ButtonAttrs> {
  view(vnode) {
    const {
      className,
      tableName,
      headers,
      entries
    } = vnode.attrs;
    return (
      <div class={`${className || ''} Table`}>
        <h1>{tableName}</h1>
        <table >
            <tr>
              {headers.map((head) => <th>{head}</th>)}
            </tr>
            {entries.map((row) => {
              return <tr>
                {row.map((col) => {
                  return <td>{col}</td>;
                })}
              </tr>;
            })}
        </table>
      </div>
    );
  }
}
