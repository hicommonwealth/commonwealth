/* @jsx m */

import ClassComponent from 'class_component';

import 'components/code_block.scss';
import m from 'mithril';
import { CWLabel } from './component_kit/cw_label';

import { getClasses } from './component_kit/helpers';

type CodeBlockAttrs = {
  clickToSelect: boolean;
};

export class CodeBlock extends ClassComponent<CodeBlockAttrs> {
  view(vnode: m.VnodeDOM<CodeBlockAttrs, this>) {
    const { clickToSelect } = vnode.attrs;

    return (
      <div class={getClasses<CodeBlockAttrs>({ clickToSelect }, 'CodeBlock')}>
        <CWLabel label="Use subkey to sign this transaction" />
        <pre
          onclick={(e) => {
            e.preventDefault();

            const element = vnode.dom;

            if (window.getSelection) {
              const sel = window.getSelection();

              sel.removeAllRanges();

              const range = document.createRange();

              range.selectNodeContents(element);

              sel.addRange(range);
            }
          }}
        >
          {vnode.children}
        </pre>
      </div>
    );
  }
}
