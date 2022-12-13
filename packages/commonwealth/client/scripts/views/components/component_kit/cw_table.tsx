/* @jsx m */

import m, { Vnode } from 'mithril';
import ClassComponent from 'class_component';

import 'components/quill/component_kit/cw_table.scss';
import { CWText } from 'views/components/component_kit/cw_text';

export type ButtonAttrs = {
  className?: string;
  headers: string[] | Vnode<never>[];
  entries: Vnode<never>[][];
};

// TODO Graham 5-16-22: Only styled for simple two-column table; needs extending
// Eventually should have filtering/sorting functionality added
export class CWTable extends ClassComponent<ButtonAttrs> {
  view(vnode) {
    const { className, headers, entries } = vnode.attrs;
    return (
      <div class={`${className || ''} Table`}>
        <table>
          <tr>
            {headers.map((headerText: string) => (
              <th>
                <CWText type="h4" fontWeight="medium">
                  {headerText}
                </CWText>
              </th>
            ))}
          </tr>
          {entries.map((row) => {
            return (
              <tr>
                {row.map((cellText: string) => {
                  return (
                    <td>
                      <CWText fontWeight={'regular'}>{cellText}</CWText>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </table>
      </div>
    );
  }
}
