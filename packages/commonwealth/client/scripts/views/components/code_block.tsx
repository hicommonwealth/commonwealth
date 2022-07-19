import m from 'mithril';

import 'components/code_block.scss';

import { getClasses } from './component_kit/helpers';

type CodeBlockAttrs = {
  clickToSelect: boolean;
};

export const CodeBlock: m.Component<CodeBlockAttrs> = {
  view: (vnode: m.VnodeDOM<CodeBlockAttrs>) => {
    const clickToSelect = !!vnode.attrs.clickToSelect;

    // CodeBlock'

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
  },
};
