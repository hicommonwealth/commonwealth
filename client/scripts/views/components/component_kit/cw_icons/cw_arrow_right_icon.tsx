/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_icon.scss';

import { IconStyleAttrs } from '../cw_icon';
import { getIconClasses } from '../helpers';

export const CWArrowRight: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    const { iconSize, iconType, disabled } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ iconSize, iconType, disabled })}
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="15"
        fill="none"
        viewBox="0 0 10 15"
      >
        <path
          stroke="#999"
          strokeLinecap="round"
          d="M.732 1.312L8.39 7.777.73 14.24"
        />
      </svg>
    );
  },
};
