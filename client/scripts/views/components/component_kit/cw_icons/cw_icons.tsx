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
        width="20"
        height="15"
        fill="none"
        viewBox="0 0 20 15"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M18.727 7.5S14.76 14 9.864 14C4.968 14 1 7.5 1 7.5S4.968 1 9.864 1c4.895 0 8.863 6.5 8.863 6.5z"
        ></path>
        <circle
          cx="9.863"
          cy="7.5"
          r="2.955"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        ></circle>
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
          stroke-miterlimit="16"
          stroke-width="1.5"
          d="M15 8V1H8m7 9.5V13a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2h2.5M8 8l6.5-6.5"
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
        width="28"
        height="28"
        fill="none"
        viewBox="0 0 28 28"
      >
        <path
          stroke-linecap="round"
          stroke-width="1.5"
          d="M18.071 18.071c-3.905 3.905-10.237 3.905-14.142 0C.024 14.166.024 7.834 3.929 3.93 7.834.024 14.166.024 18.07 3.929c3.905 3.905 3.905 10.237 0 14.142z"
        ></path>
        <path stroke-linecap="square" stroke-width="1.5" d="M19 19l7 7"></path>
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

export const CWElement: m.Component<IconStyleAttrs> = {
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
        <g
          fill="#000"
          fill-rule="evenodd"
          clip-path="url(#clip0_729_15085)"
          clip-rule="evenodd"
        >
          <path d="M10.848 1.68c0-.928.752-1.68 1.68-1.68 6.185 0 11.2 5.015 11.2 11.2a1.68 1.68 0 01-3.36 0 7.84 7.84 0 00-7.84-7.84 1.68 1.68 0 01-1.68-1.68zM18.687 26.32a1.68 1.68 0 01-1.68 1.68c-6.186 0-11.2-5.014-11.2-11.2a1.68 1.68 0 013.36 0 7.84 7.84 0 007.84 7.84c.927 0 1.68.752 1.68 1.68zM2.448 17.92a1.68 1.68 0 01-1.68-1.68c0-6.185 5.014-11.2 11.2-11.2a1.68 1.68 0 010 3.36 7.84 7.84 0 00-7.84 7.84 1.68 1.68 0 01-1.68 1.68zM27.089 10.08c.928 0 1.68.752 1.68 1.68 0 6.186-5.015 11.2-11.2 11.2a1.68 1.68 0 110-3.36 7.84 7.84 0 007.84-7.84c0-.928.752-1.68 1.68-1.68z"></path>
        </g>
        <defs>
          <clipPath id="clip0_729_15085">
            <path d="M0 0H28V28H0z" transform="translate(.768)"></path>
          </clipPath>
        </defs>
      </svg>
    );
  },
};

export const CWTelegram: m.Component<IconStyleAttrs> = {
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
        <path
          fill-rule="evenodd"
          d="M23.02 24.253l4.206-20.231a.673.673 0 00-.9-.765L2.887 12.298a.673.673 0 00.007 1.26l5.71 2.13 2.21 7.11a.672.672 0 001.069.32l3.183-2.594a.95.95 0 011.157-.033l5.742 4.169a.673.673 0 001.054-.407zm-12.56-9.699L21.62 7.68c.201-.123.408.148.235.308l-9.21 8.562a1.91 1.91 0 00-.592 1.143l-.314 2.325c-.042.31-.478.341-.564.04l-1.206-4.24c-.138-.483.063-1 .49-1.264z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWWebsite: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    return (
      <svg
        class={getIconClasses(vnode.attrs)}
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        fill="none"
        viewBox="0 0 30 30"
      >
        <circle cx="15" cy="15" r="14" stroke-width="1.5"></circle>
        <ellipse cx="15" cy="15" stroke-width="1.5" rx="9" ry="14"></ellipse>
        <ellipse cx="15" cy="15" stroke-width="1.5" rx="3" ry="14"></ellipse>
        <path strokeW-width="1.5" d="M1 15h28M3 8h24M3 22h24"></path>
      </svg>
    );
  },
};

export const CWGithub: m.Component<IconStyleAttrs> = {
  view: (vnode) => {
    return (
      <svg
        class={getIconClasses(vnode.attrs)}
        xmlns="http://www.w3.org/2000/svg"
        width="33"
        height="32"
        fill="none"
        viewBox="0 0 33 32"
      >
        <g clipPath="url(#clip0_796_10037)">
          <path
            fill-rule="evenodd"
            d="M16.291 0a16.29 16.29 0 00-5.15 31.75c.81.15 1.11-.35 1.11-.79v-2.77c-4.55.99-5.51-2.19-5.51-2.19a4.31 4.31 0 00-1.81-2.38c-1.48-1 .11-1 .11-1a3.42 3.42 0 012.5 1.68 3.47 3.47 0 004.74 1.35 3.48 3.48 0 011-2.18c-3.58-.39-7.38-1.79-7.38-8.03a6.3 6.3 0 011.68-4.37 5.86 5.86 0 01.16-4.31s1.37-.44 4.48 1.67a15.44 15.44 0 018.16 0c3.11-2.11 4.48-1.67 4.48-1.67a5.85 5.85 0 01.14 4.31 6.29 6.29 0 011.67 4.37c0 6.26-3.81 7.63-7.44 8a3.89 3.89 0 011.11 3v4.47c0 .54.29.94 1.12.78A16.29 16.29 0 0016.291 0z"
            clip-rule="evenodd"
          ></path>
        </g>
        <defs>
          <clipPath id="clip0_796_10037">
            <path d="M0 0H32.58V31.77H0z"></path>
          </clipPath>
        </defs>
      </svg>
    );
  },
};
