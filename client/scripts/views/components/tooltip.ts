import 'components/tooltip.scss';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/animations/shift-away-subtle.css';

import tippy from 'tippy.js';
import { default as $ } from 'jquery';
import { default as m } from 'mithril';

// Tooltip
//
// Accepts text or Mithril vnodes. By default, Mithril vnodes will be only be rendered when
// the tooltip is created (and not re-rendered afterwards).
//
// IMPORTANT: If passing the tooltip Mithril vnodes, do not reuse those vnodes anywhere else.
//
// Otherwise, the tooltip's internal renderer may take over the DOM diffing cache, so the
// vnodes will not be updated in other places where they are used.
//

interface ITooltipAttrs {
  content;
}

const Tooltip : m.Component<ITooltipAttrs, { tippy, renderedElement }> = {
  view: (vnode) => {
    const { content } = vnode.attrs;
    const isString = typeof content === 'string';
    if (!isString) {
      if (!vnode.state.renderedElement) vnode.state.renderedElement = document.createElement('div');
      m.render(vnode.state.renderedElement, content);
    }

    return m('span.Tooltip', {
      oncreate: (vvnode) => {
        vnode.state.tippy = tippy(vvnode.dom, {
          content: isString ? content : vnode.state.renderedElement,
          allowHTML: isString ? false : true,
          theme: 'light',
          animation: 'shift-away-subtle',
          delay: [150, 0],
          interactive: true,
          interactiveBorder: 3,
        });
      }
    }, vnode.children);
  }
};

export default Tooltip;
