/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_icon.scss';

import { IconStyleAttrs } from '../cw_icon';
import { getIconClasses } from '../helpers';

export const CWArrowDown: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    const { iconSize, iconType, disabled } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ iconSize, iconType, disabled })}
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="10"
        fill="none"
        viewBox="0 0 15 10"
      >
        <path
          stroke="#999"
          strokeLinecap="round"
          d="M14.027.947L7.562 8.606 1.098.947"
        />
      </svg>
    );
  },
};
