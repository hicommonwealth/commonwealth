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
        height="15"
        fill="none"
        viewBox="0 0 15 15"
      >
        <path
          fill-rule="evenodd"
          d="M3.025 1.721c-.69 0-1.25.56-1.25 1.25v8.727c0 .69.56 1.25 1.25 1.25h8.728c.69 0 1.25-.56 1.25-1.25V9.062h1.5v2.636a2.75 2.75 0 01-2.75 2.75H3.025a2.75 2.75 0 01-2.75-2.75V2.971a2.75 2.75 0 012.75-2.75h2.637v1.5H3.025zm8.916 0H7.782V.22h6.72v6.72h-1.5V2.78L7.92 7.866l-1.06-1.06L11.94 1.72z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWFeedback: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    return (
      <svg
        class={getIconClasses(vnode.attrs)}
        xmlns="http://www.w3.org/2000/svg"
        width="19"
        height="20"
        fill="none"
        viewBox="0 0 19 20"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M1.709 17.71a.75.75 0 001.297.513l3.043-3.246h9.47c.648 0 1.26-.275 1.702-.747.44-.47.68-1.098.68-1.744V3.779c0-.645-.24-1.274-.68-1.744a2.332 2.332 0 00-1.702-.747H4.091c-.648 0-1.259.275-1.701.747a2.552 2.552 0 00-.681 1.744V17.71z"
        ></path>
      </svg>
    );
  },
};

export const CWAccount: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    return (
      <svg
        class={getIconClasses(vnode.attrs)}
        xmlns="http://www.w3.org/2000/svg"
        width="21"
        height="22"
        fill="none"
        viewBox="0 0 21 22"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M18.264 20.281v-5.04a4.268 4.268 0 00-4.269-4.268H6.833a4.268 4.268 0 00-4.269 4.269v5.04"
        ></path>
        <path
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M14.667 5.97a4.252 4.252 0 11-8.505 0 4.252 4.252 0 018.505 0z"
        ></path>
      </svg>
    );
  },
};

export const CWSearch: m.Component<IconStyleAttrs> = {
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
          d="M17.584 9.86a7.81 7.81 0 11-15.621 0 7.81 7.81 0 0115.621 0zm-1.778 7.093a9.274 9.274 0 01-6.032 2.218 9.31 9.31 0 119.31-9.31 9.274 9.274 0 01-2.218 6.031l3.028 3.028a.75.75 0 11-1.061 1.06l-3.027-3.027z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};
