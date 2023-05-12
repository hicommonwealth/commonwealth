import React, { createElement } from 'react';

// This is legacy code from mithril interop layer. This method should
// not be used anymore in new functionalities. We want to
// gracefully get rid of it from the codebase
export const render = (
  tag: string | React.ComponentType,
  attrs: any = {},
  ...children: any[]
) => {
  let className = attrs?.className;

  // check if selector uses classes (.) and convert to props, as
  // Mithril supports e.g. `.User.etc` tags while React does not
  if (typeof tag === 'string' && tag.includes('.')) {
    const [selector, ...classes] = tag.split('.');

    if (className) {
      className = `${className} ${classes.join(' ')}`;
    } else {
      className = classes.join(' ');
    }

    // replace pure class selector (e.g. .User) with div (e.g. div.User)
    tag = selector || 'div';
  }

  // handle children without attrs => corresponds to `m(tag, children)`
  if (Array.isArray(attrs) || typeof attrs !== 'object') {
    children = attrs;
    attrs = { className };
  } else {
    attrs = { ...attrs };
  }

  // ensure vnode.className exists
  attrs.className = className;

  // react forbids <img> and <br> tags to have children
  if (tag === 'img' || tag == 'br') {
    return createElement(tag, attrs);
  }

  // ensure vnode.children exists as mithril expects
  attrs.children = children;

  return createElement(tag, attrs, ...children);
};

// corresponds to Mithril's `m.trust()` call, which is used to render inner HTML directly
render.trust = (html: string, wrapper?: string) => {
  if (wrapper) {
    return createElement(wrapper, {
      dangerouslySetInnerHTML: { __html: html },
    });
  } else {
    return createElement('div', { dangerouslySetInnerHTML: { __html: html } });
  }
};
