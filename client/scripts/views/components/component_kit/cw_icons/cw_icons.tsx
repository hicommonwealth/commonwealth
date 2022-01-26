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
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 16 16"
      >
        <path
          fill-rule="evenodd"
          d="M3.662 2.357c-.69 0-1.25.56-1.25 1.25v8.728c0 .69.56 1.25 1.25 1.25h8.727c.69 0 1.25-.56 1.25-1.25V9.698h1.5v2.637a2.75 2.75 0 01-2.75 2.75H3.662a2.75 2.75 0 01-2.75-2.75V3.607a2.75 2.75 0 012.75-2.75h2.636v1.5H3.662zm8.916 0H8.42v-1.5h6.72v6.72h-1.5V3.418L8.556 8.501l-1.06-1.06 5.082-5.084z"
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

export const CWDiscord: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    return (
      <svg
        class={getIconClasses(vnode.attrs)}
        xmlns="http://www.w3.org/2000/svg"
        width="29"
        height="28"
        fill="none"
        viewBox="0 0 29 28"
      >
        <g clip-path="url(#clip0_729_15084)">
          <path d="M25.556 5.908s-3.093-2.42-6.743-2.697l-.33.659c3.3.808 4.815 1.964 6.398 3.387-2.728-1.393-5.421-2.698-10.114-2.698-4.694 0-7.386 1.305-10.115 2.698C6.235 5.834 8.037 4.549 11.05 3.87l-.33-.66c-3.83.362-6.742 2.698-6.742 2.698S.524 10.916-.068 20.743c3.48 4.014 8.766 4.046 8.766 4.046l1.106-1.473c-1.878-.652-3.995-1.817-5.826-3.921 2.183 1.652 5.478 3.371 10.789 3.371 5.31 0 8.605-1.72 10.789-3.371-1.83 2.104-3.948 3.269-5.826 3.921l1.106 1.473s5.286-.032 8.766-4.046c-.593-9.827-4.046-14.835-4.046-14.835zM10.384 18.046c-1.305 0-2.36-1.207-2.36-2.697s1.056-2.698 2.36-2.698c1.304 0 2.36 1.207 2.36 2.698 0 1.49-1.056 2.697-2.36 2.697zm8.766 0c-1.304 0-2.36-1.207-2.36-2.697s1.056-2.698 2.36-2.698c1.304 0 2.36 1.207 2.36 2.698 0 1.49-1.056 2.697-2.36 2.697z"></path>
        </g>
        <defs>
          <clipPath id="clip0_729_15084">
            <path d="M0 0H28V28H0z" transform="translate(.768)"></path>
          </clipPath>
        </defs>
      </svg>
    );
  },
};
