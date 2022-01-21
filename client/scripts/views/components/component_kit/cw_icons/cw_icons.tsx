/* @jsx m */

/* eslint-disable max-len */

import m from 'mithril';
import 'components/component_kit/cw_icon.scss';

import { IconStyleAttrs } from './cw_icon';
import { getIconClasses } from '../helpers';

export const CWViews: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    return (
      <svg
        class={getIconClasses(vnode.attrs)}
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="17"
        fill="none"
        viewBox="0 0 22 17"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M1 8.503s3.564-7 9.802-7c6.237 0 9.802 7 9.802 7s-3.565 7-9.802 7c-6.238 0-9.802-7-9.802-7z"
          clip-rule="evenodd"
        ></path>
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M10.802 11.75c1.826 0 3.307-1.453 3.307-3.246 0-1.794-1.48-3.247-3.307-3.247-1.826 0-3.306 1.453-3.306 3.247 0 1.793 1.48 3.246 3.306 3.246z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWCreate: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    return (
      <svg
        class={getIconClasses(vnode.attrs)}
        xmlns="http://www.w3.org/2000/svg"
        width="21"
        height="21"
        fill="none"
        viewBox="0 0 21 21"
      >
        <path
          stroke-linecap="round"
          stroke-width="1.5"
          d="M10.455 2.4v16.993M1.957 10.896H18.95"
        ></path>
      </svg>
    );
  },
};

export const CWExternalLink: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    return (
      <svg
        class={getIconClasses(vnode.attrs)}
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="16"
        fill="none"
        viewBox="0 0 15 16"
      >
        <path
          stroke-width="1.5"
          d="M5.662 1.971H3.025a2 2 0 00-2 2v8.727a2 2 0 002 2h8.728a2 2 0 002-2v-2.636M7.783 1.97h5.97m0 0v5.97m0-5.97L7.388 8.334"
        ></path>
      </svg>
    );
  },
};
