/* @jsx m */
/* eslint-disable no-empty */

import m from 'mithril';

// import 'components/component_kit/cw_tooltip.scss';

import { CWPopover, PopoverAttrs } from './cw_popover/cw_popover';

export class CWTooltip implements m.ClassComponent<PopoverAttrs> {
  view(vnode) {
    const { content, ...otherAttrs } = vnode.attrs;

    return <CWPopover {...otherAttrs} content={content} showArrow />;
  }
}
