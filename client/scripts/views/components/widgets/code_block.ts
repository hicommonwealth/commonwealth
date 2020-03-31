import 'components/widgets/code_block.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';

interface IAttrs {
  clickToSelect: boolean;
}

const CodeBlock: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    const clickToSelect = !!vnode.attrs.clickToSelect;
    return m('pre.CodeBlock', {
      class: clickToSelect ? 'click-to-select' : '',
      onclick: (e) => {
        e.preventDefault();
        const element = vnode.dom;
        if (window.getSelection) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(element);
          sel.addRange(range);
        }
      },
    }, vnode.children);
  }
};

export default CodeBlock;
