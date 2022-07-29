import m from 'mithril';

interface IAttrs {
  class?: string;
  disabled?: boolean;
  onkeypress?: CallableFunction;
  oninput?: CallableFunction;
  oncreate?;
  name?: string;
  placeholder?: string;
  style?: any;
  title?: string;
}

const ResizableTextarea = {
  view: (vnode) => {
    const { attrs, children } = vnode;
    const { oninput, oncreate } = attrs;
    attrs.oncreate = (e) => {
      vnode.dom.style.height = 'auto';
      vnode.dom.style.height = `${vnode.dom.scrollHeight}px`;
      if (oncreate) oncreate(e);
    };
    attrs.oninput = (e) => {
      e.preventDefault();
      e.stopPropagation();
      vnode.dom.style.height = 'auto';
      vnode.dom.style.height = `${vnode.dom.scrollHeight}px`;
      if (oninput) oninput(e);
    };
    return m('textarea.ResizableTextarea', attrs, children);
  }
};

export default ResizableTextarea;
