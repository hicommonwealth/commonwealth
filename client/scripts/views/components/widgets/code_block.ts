import 'components/widgets/code_block.scss';

import m from 'mithril';
import $ from 'jquery';

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
