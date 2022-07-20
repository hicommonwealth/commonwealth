import m from 'mithril';

import 'components/code_block.scss';

import { getClasses } from './component_kit/helpers';

type CodeBlockAttrs = {
  clickToSelect: boolean;
};

export class CodeBlock implements m.ClassComponent<CodeBlockAttrs> {
  view(vnode) {
    const { clickToSelect } = vnode.attrs;

    return (
      <pre
        class={getClasses<CodeBlockAttrs>({ clickToSelect }, 'CodeBlock')}
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
    );
  }
}
