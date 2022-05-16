/* @jsx m */

/* eslint-disable max-len */

import m from 'mithril';

import 'components/component_kit/cw_icon.scss';
import 'components/component_kit/cw_icon_button.scss';

import { getClasses } from '../helpers';
import { IconAttrs, IconStyleAttrs } from './types';

export const CWArrowLeft: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M2.244 15.582a.482.482 0 000 .836l13.038 7.517a.483.483 0 00.724-.418V17h13.5a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-13.5V8.483a.483.483 0 00-.724-.418L2.244 15.582z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWArrowRight: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M29.764 16.418a.482.482 0 000-.836L16.727 8.065a.483.483 0 00-.724.418V15h-13.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h13.5v6.517c0 .371.402.603.724.418l13.037-7.517z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWBadge: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M15.56 5.391a.5.5 0 01.88 0l2.75 5.06a.5.5 0 00.453.262l5.758-.148a.5.5 0 01.439.761l-3.007 4.913a.5.5 0 000 .522l3.007 4.913a.5.5 0 01-.44.76l-5.757-.147a.5.5 0 00-.453.261l-2.75 5.06a.5.5 0 01-.88 0l-2.75-5.06a.5.5 0 00-.453-.26l-5.758.147a.5.5 0 01-.439-.761l3.007-4.913a.5.5 0 000-.522L6.16 11.326a.5.5 0 01.44-.76l5.757.147a.5.5 0 00.453-.261l2.75-5.06z"></path>
        <path d="M17.083 4.583a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0zM17.083 28.417a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0zM27.183 22.458a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0zM6.882 22.458a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0zM6.882 10.64a1.083 1.083 0 11-2.167 0 1.083 1.083 0 012.167 0zM27.183 10.64a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0z"></path>
      </svg>
    );
  },
};

export const CWBell: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M19.456 27.043a3.456 3.456 0 11-6.913.001 3.456 3.456 0 016.913 0zM18.42 4.747a2.247 2.247 0 11-4.494 0 2.247 2.247 0 014.493 0z"></path>
        <path
          fill-rule="evenodd"
          d="M16 5.957c-5.191 0-9.4 4.179-9.4 9.333v6.417a.585.585 0 01-.587.583H4.838a.585.585 0 00-.588.584v1.166c0 .322.263.584.588.584h22.325a.585.585 0 00.587-.584v-1.166a.585.585 0 00-.587-.584h-1.175a.585.585 0 01-.588-.583V15.29c0-5.154-4.208-9.333-9.4-9.333z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWCautionCircle: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M15.333 9.75a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.502a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V9.75zM17.667 21.836a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
        <path d="M15.333 9.75a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.502a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V9.75zM17.667 21.836a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
        <path
          fill-rule="evenodd"
          d="M16 28c6.627 0 12-5.373 12-12S22.627 4 16 4 4 9.373 4 16s5.373 12 12 12zm0 2c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16s6.268 14 14 14z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWCautionTriangle: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M15.67 6.31L3.982 26.577h23.376L15.67 6.31zm.766-2.867a.884.884 0 00-1.532 0L1.12 27.345a.885.885 0 00.766 1.328h27.568a.885.885 0 00.766-1.328L16.436 3.443z"
          clip-rule="evenodd"
        ></path>
        <path d="M14.67 11.585a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.503a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-8.503zM17.003 23.672a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
        <path d="M14.67 11.585a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.503a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-8.503zM17.003 23.672a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
      </svg>
    );
  },
};

export const CWCheck: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M27.62 6.416a1 1 0 01.165 1.405L12.426 27.25l-8.09-7.18a1 1 0 111.328-1.496l6.506 5.774L26.215 6.58a1 1 0 011.405-.164z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWChevronDown: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M25.153 11.117a1 1 0 01.105 1.41l-8.614 10a1 1 0 01-1.515 0l-8.387-9.736a1 1 0 011.516-1.306l7.629 8.858 7.855-9.12a1 1 0 011.41-.106z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWChevronLeft: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M21.758 7.472a1 1 0 00-1.41-.105l-10 8.614a1 1 0 000 1.515l9.736 8.387a1 1 0 101.305-1.516l-8.857-7.629 9.12-7.855a1 1 0 00.106-1.41z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWChevronRight: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M10.242 7.597a1 1 0 011.41-.105l10 8.614a1 1 0 010 1.515l-9.736 8.387a1 1 0 11-1.305-1.516l8.857-7.629-9.12-7.855a1 1 0 01-.106-1.41z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWChevronUp: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M6.847 21.758a1 1 0 01-.105-1.41l8.614-10a1 1 0 011.515 0l8.387 9.736a1 1 0 01-1.516 1.306l-7.629-8.858-7.855 9.12a1 1 0 01-1.41.106z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWClose: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <g clip-path="url(#clip0_402_12158)">
          <path d="M6.454 6.247c.195-.195.6-.107.904.196l18.699 18.7c.303.303.391.708.196.903l-.707.707c-.195.195-.6.107-.904-.197L5.943 7.858c-.303-.304-.391-.709-.196-.904l.707-.707z"></path>
          <path d="M26.253 6.954c.195.195.107.6-.196.904l-18.7 18.699c-.303.303-.708.391-.903.196l-.707-.707c-.195-.195-.107-.6.196-.904l18.7-18.699c.303-.303.708-.391.903-.196l.707.707z"></path>
        </g>
        <defs>
          <clipPath id="clip0_402_12158">
            <path d="M0 0H32V32H0z" transform="translate(0 .5)"></path>
          </clipPath>
        </defs>
      </svg>
    );
  },
};

export const CWCloud: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <circle cx="16.069" cy="9.273" r="7.273"></circle>
        <circle cx="16.069" cy="9.273" r="7.273"></circle>
        <circle cx="23.904" cy="11.698" r="4.849"></circle>
        <circle cx="8.096" cy="11.698" r="4.849"></circle>
        <path
          fill-rule="evenodd"
          d="M6.916 17.725l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM23.858 17.725l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM6.916 26.306l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM11.789 21.433l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM23.858 26.306l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM16.024 17.725l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM16.024 26.306l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM20.26 21.433l-.926 1.97h.001a1.135 1.135 0 101.939 0l-.924-1.97a.05.05 0 00-.09 0z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWCollapse: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M17 29a1 1 0 01-1 1H3a1 1 0 01-1-1V16a1 1 0 112 0v10.586l11.293-11.293a1 1 0 011.414 1.414L5.414 28H16a1 1 0 011 1z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWCopy: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M16.5 11.5a.5.5 0 01.5.5v15a.5.5 0 01-.5.5h-11A.5.5 0 015 27V12a.5.5 0 01.5-.5h11zm2-2a.5.5 0 01.5.5v19a.5.5 0 01-.5.5h-15A.5.5 0 013 29V10a.5.5 0 01.5-.5h15z"
          clip-rule="evenodd"
        ></path>
        <path d="M26 6a.5.5 0 00-.5-.5h-11a.5.5 0 00-.5.5v3.5h-2V4a.5.5 0 01.5-.5h15a.5.5 0 01.5.5v19a.5.5 0 01-.5.5H19v-2h6.5a.5.5 0 00.5-.5V6z"></path>
      </svg>
    );
  },
};

export const CWCouncilProposal: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M14.586 8.914a2 2 0 012.828 0l6.364 6.364a2 2 0 010 2.829l-6.364 6.364a2 2 0 01-2.828 0l-6.364-6.364a2 2 0 010-2.829l6.364-6.364zM11 8.5a3 3 0 11-6 0 3 3 0 016 0zM27 8.5a3 3 0 11-6 0 3 3 0 016 0zM11 24.5a3 3 0 11-6 0 3 3 0 016 0zM27 24.5a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    );
  },
};

export const CWCow: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M5.857 2.431a1.432 1.432 0 00-2.08 0l-.395.411c-1.532 1.592-1.532 4.173 0 5.765l.64.666a2.933 2.933 0 00-1.906.904l-1.41 1.466a1.066 1.066 0 000 1.467 2.914 2.914 0 004.233 0l.09-.094c-.027.28-.04.563-.04.85v7.925a8.998 8.998 0 004.68 7.898 6.194 6.194 0 003.537 1.102h5.516c1.313 0 2.53-.406 3.534-1.1a8.998 8.998 0 004.684-7.9v-7.925a9.11 9.11 0 00-.047-.93l.168.174a2.914 2.914 0 004.233 0c.39-.405.39-1.062 0-1.467l-1.411-1.466a2.933 2.933 0 00-1.906-.904l.64-.666c1.532-1.592 1.532-4.173 0-5.765l-.395-.41a1.432 1.432 0 00-2.08 0l-3.54 3.678a1.642 1.642 0 00-.033.036 8.959 8.959 0 00-4.629-1.28h-4.025a8.957 8.957 0 00-4.51 1.253l-.008-.009-3.54-3.679zm-1.04 1.802L7.664 7.19 6.228 8.683l-1.46-1.517a2.095 2.095 0 010-2.883l.049-.05zm22.365 0L24.336 7.19l1.435 1.492 1.46-1.517a2.095 2.095 0 000-2.883l-.049-.05zM9.117 8.839c-.09.389-.137.795-.137 1.212 0 2.864 2.234 5.185 4.989 5.185s4.989-2.322 4.989-5.185c0-1.201-.393-2.306-1.052-3.185h.034a7 7 0 017 7v7.925c0 .487-.05.963-.144 1.422a6.225 6.225 0 00-6.074-4.866h-5.516a6.225 6.225 0 00-6.073 4.863 7.03 7.03 0 01-.144-1.419v-7.925a6.98 6.98 0 012.128-5.027zm1.607 19.146a6.968 6.968 0 003.243.806h3.995a6.968 6.968 0 003.24-.804 4.222 4.222 0 00-2.48-7.64h-5.516a4.222 4.222 0 00-2.482 7.638zm-1.245-9.638c.826 0 1.496-.696 1.496-1.556 0-.859-.67-1.555-1.496-1.555-.827 0-1.497.696-1.497 1.555 0 .86.67 1.556 1.497 1.556zm14.467-1.556c0 .86-.67 1.556-1.497 1.556-.826 0-1.496-.696-1.496-1.556 0-.859.67-1.555 1.496-1.555.827 0 1.497.696 1.497 1.555zm-11.973 8.815c.551 0 .998-.464.998-1.037s-.447-1.037-.998-1.037c-.551 0-.998.464-.998 1.037s.447 1.037.998 1.037zm8.98-1.037c0 .573-.447 1.037-.998 1.037-.55 0-.997-.464-.997-1.037s.446-1.037.997-1.037c.552 0 .998.464.998 1.037z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWDemocraticProposal: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M10.692 3.301c.11-1.343-1.736-1.82-2.29-.592l-1.9 4.212a1.99 1.99 0 00-1.033-.287H4a2 2 0 00-2 2v6a2 2 0 002 2h1.47c.7 0 1.316-.36 1.673-.905l1.858.879c.334.158.7.24 1.069.24h2.963a2.5 2.5 0 002.49-2.287l.515-6.024a2 2 0 00-1.992-2.17h-3.608l.254-3.066zM5.469 8.634H4v6h1.47v-6zM23.644 29.14c-.554 1.229-2.4.75-2.29-.592l.253-3.065H18a2 2 0 01-1.993-2.17l.515-6.025A2.5 2.5 0 0119.012 15h2.964c.37 0 .735.082 1.069.24l1.857.879a1.998 1.998 0 011.674-.905h1.47a2 2 0 012 2v6a2 2 0 01-2 2h-1.47a1.99 1.99 0 01-1.032-.287l-1.9 4.212zm2.932-5.925h1.47v-6h-1.47v6z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWDiscord: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M26.182 8.864s-2.918-2.285-6.364-2.546l-.31.622c3.114.763 4.543 1.854 6.037 3.196C22.97 8.822 20.43 7.591 16 7.591c-4.43 0-6.97 1.23-9.545 2.545 1.494-1.342 3.194-2.555 6.037-3.196l-.31-.622c-3.615.34-6.364 2.546-6.364 2.546S2.56 13.589 2 22.864c3.284 3.788 8.273 3.818 8.273 3.818l1.043-1.39a12.748 12.748 0 01-5.498-3.701c2.06 1.559 5.17 3.182 10.182 3.182 5.011 0 8.121-1.623 10.182-3.182a12.74 12.74 0 01-5.498 3.701l1.043 1.39s4.99-.03 8.273-3.818c-.56-9.275-3.818-14-3.818-14zM11.864 20.318c-1.231 0-2.228-1.139-2.228-2.545 0-1.407.997-2.546 2.228-2.546 1.23 0 2.227 1.14 2.227 2.546s-.997 2.545-2.227 2.545zm8.272 0c-1.23 0-2.227-1.139-2.227-2.545 0-1.407.997-2.546 2.227-2.546 1.231 0 2.228 1.14 2.228 2.546s-.997 2.545-2.228 2.545z"></path>
      </svg>
    );
  },
};

export const CWDots: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M8.059 16a3 3 0 11-6 0 3 3 0 016 0zM18.858 16a3 3 0 11-6 0 3 3 0 016 0zM30.058 16c0 1.657-1.432 3-3.2 3-1.767 0-3.2-1.343-3.2-3s1.433-3 3.2-3c1.768 0 3.2 1.343 3.2 3z"></path>
      </svg>
    );
  },
};

export const CWDownvote: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M16.73 27.828a.843.843 0 01-1.46 0L2.113 5.018a.845.845 0 01.731-1.268h26.31c.65 0 1.055.704.73 1.267l-13.154 22.81z"></path>
      </svg>
    );
  },
};

export const CWEdit: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M5.946 27.517a.5.5 0 01-.607-.567l1.193-7.269-.002-.002L20.867 4.335a2 2 0 012.827-.095l3.654 3.413a2 2 0 01.095 2.827L13.107 25.822l.013.012-7.174 1.683zm5.927-3.445l-3.685.865-.422-.428.642-3.911.064-.069 3.401 3.543zm8.427-16.2l3.71 3.352 1.972-2.11-3.653-3.413L20.3 7.87z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWElement: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M12.08 4.18c0-.928.753-1.68 1.68-1.68 6.186 0 11.2 5.014 11.2 11.2a1.68 1.68 0 01-3.36 0 7.84 7.84 0 00-7.84-7.84 1.68 1.68 0 01-1.68-1.68zM19.92 28.82a1.68 1.68 0 01-1.68 1.68c-6.186 0-11.2-5.014-11.2-11.2a1.68 1.68 0 013.36 0 7.84 7.84 0 007.84 7.84c.927 0 1.68.752 1.68 1.68zM3.68 20.42A1.68 1.68 0 012 18.74c0-6.186 5.014-11.2 11.2-11.2a1.68 1.68 0 010 3.36 7.84 7.84 0 00-7.84 7.84 1.68 1.68 0 01-1.68 1.68zM28.32 12.58c.928 0 1.68.752 1.68 1.68 0 6.185-5.014 11.2-11.2 11.2a1.68 1.68 0 110-3.36 7.84 7.84 0 007.84-7.84c0-.928.752-1.68 1.68-1.68z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWExpand: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M15 3a1 1 0 011-1h13a1 1 0 011 1v13a1 1 0 11-2 0V5.414L16.707 16.707a1 1 0 01-1.414-1.414L26.586 4H16a1 1 0 01-1-1z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWExternalLink: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M5 4.5a1 1 0 00-1 1v22a1 1 0 001 1h22a1 1 0 001-1v-6.357a1 1 0 112 0V27.5a3 3 0 01-3 3H5a3 3 0 01-3-3v-22a3 3 0 013-3h6.357a1 1 0 110 2H5zm10-1a1 1 0 011-1h13a1 1 0 011 1v13a1 1 0 11-2 0V5.914L16.707 17.207a1 1 0 01-1.414-1.414L26.586 4.5H16a1 1 0 01-1-1z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWFeedback: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M2 5.687c0-.38.313-.687.699-.687H29.3c.386 0 .699.308.699.687v20.625c0 .605-.74.915-1.183.495l-4.028-3.808H2.7A.693.693 0 012 22.312V5.687zM8 16a2 2 0 100-4 2 2 0 000 4zm10-2a2 2 0 11-4 0 2 2 0 014 0zm6 2a2 2 0 100-4 2 2 0 000 4z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWFilter: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M13.652 25.102a2 2 0 01-.457-1.272v-5.476L4.38 6.173A2 2 0 016 3h21a2 2 0 011.62 3.173l-8.814 12.18V27a2 2 0 01-3.544 1.271l-2.61-3.17zm4.154-7.397L27 5H6l9.195 12.707v6.123l2.61 3.17v-9.295z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWFlag: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M28 3.278c0-.43-.384-.778-.857-.778H4.857c-.473 0-.857.348-.857.778V29.72c0 .706.953 1.046 1.484.53l9.89-9.624a.918.918 0 011.253 0l9.889 9.624c.53.516 1.484.176 1.484-.53V3.277z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWFlame: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M19.909 30.332c-.215.043-.378-.314-.244-.487 1.575-2.034-.621-6.082-2.787-8.747a1.122 1.122 0 00-1.756 0c-2.166 2.665-4.362 6.713-2.787 8.747.134.173-.029.53-.244.487C-.757 27.749 7.91 11.445 15.085 2.93a1.189 1.189 0 011.83 0c7.176 8.515 15.842 24.82 2.994 27.402z"></path>
      </svg>
    );
  },
};

export const CWGear: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <rect width="4" height="6" x="14" y="2.5" rx="0.5"></rect>
        <rect width="4" height="6" x="14" y="24.5" rx="0.5"></rect>
        <rect
          width="4"
          height="6"
          x="30"
          y="14.5"
          rx="0.5"
          transform="rotate(90 30 14.5)"
        ></rect>
        <rect
          width="4"
          height="6"
          x="8"
          y="14.5"
          rx="0.5"
          transform="rotate(90 8 14.5)"
        ></rect>
        <rect
          width="4"
          height="6"
          x="24.485"
          y="5.186"
          rx="0.5"
          transform="rotate(45 24.485 5.186)"
        ></rect>
        <rect
          width="4"
          height="6"
          x="8.929"
          y="20.743"
          rx="0.5"
          transform="rotate(45 8.929 20.743)"
        ></rect>
        <rect
          width="4"
          height="6"
          x="27.314"
          y="24.985"
          rx="0.5"
          transform="rotate(135 27.314 24.985)"
        ></rect>
        <rect
          width="4"
          height="6"
          x="11.757"
          y="9.429"
          rx="0.5"
          transform="rotate(135 11.757 9.429)"
        ></rect>
        <path
          fill-rule="evenodd"
          d="M16 26.5c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm0-6a4 4 0 100-8 4 4 0 000 8z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWGithub: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="33"
        height="32"
        fill="none"
        viewBox="0 0 33 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M16.067 2.5a13.878 13.878 0 00-9.115 3.417 14.431 14.431 0 00-4.77 8.639 14.61 14.61 0 001.852 9.735 14.11 14.11 0 007.59 6.185c.7.132.958-.308.958-.696v-2.44c-3.925.872-4.753-1.93-4.753-1.93a3.79 3.79 0 00-1.562-2.098c-1.277-.88.095-.88.095-.88.446.062.873.227 1.247.484.373.256.685.597.91.996.19.353.448.665.757.916a2.935 2.935 0 003.332.273 3.096 3.096 0 01.862-1.92c-3.088-.344-6.366-1.578-6.366-7.076a5.618 5.618 0 011.45-3.85 5.266 5.266 0 01.137-3.799s1.182-.387 3.865 1.472a13.05 13.05 0 017.04 0c2.682-1.86 3.864-1.472 3.864-1.472a5.257 5.257 0 01.12 3.798 5.61 5.61 0 011.442 3.85c0 5.517-3.287 6.724-6.419 7.05.334.346.592.76.757 1.216.166.456.234.942.2 1.427v3.939c0 .476.251.828.967.687a14.118 14.118 0 007.484-6.208 14.612 14.612 0 001.806-9.673 14.433 14.433 0 00-4.723-8.585A13.882 13.882 0 0016.068 2.5z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWHamburger: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="33"
        height="32"
        fill="none"
        viewBox="0 0 33 32"
        onclick={onclick}
      >
        <path d="M2 20c0-.276.348-.5.778-.5h26.444c.43 0 .778.224.778.5v1c0 .276-.348.5-.778.5H2.778c-.43 0-.778-.224-.778-.5v-1zM30 13c0 .276-.348.5-.778.5H2.778c-.43 0-.778-.224-.778-.5v-1c0-.276.348-.5.778-.5h26.444c.43 0 .778.224.778.5v1z"></path>
      </svg>
    );
  },
};

export const CWHash: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="33"
        height="32"
        fill="none"
        viewBox="0 0 33 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M13.994 7.11a1 1 0 00-1.988-.22L11.55 11H7a1 1 0 100 2h4.327l-.666 6H7a1 1 0 100 2h3.438l-.432 3.89a1 1 0 001.988.22L12.45 21h5.987l-.432 3.89a1 1 0 001.988.22L20.45 21H25a1 1 0 100-2h-4.327l.667-6H25a1 1 0 100-2h-3.438l.432-3.89a1 1 0 00-1.988-.22L19.55 11h-5.987l.432-3.89zM13.339 13l-.666 6h5.987l.667-6H13.34z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWHeartEmpty: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M17.204 27.321a2.121 2.121 0 01-2.462.003c-1.655-1.177-4.483-3.34-6.921-5.852-1.219-1.255-2.39-2.649-3.269-4.095C3.688 15.954 3 14.304 3 12.58 3 8.42 6.315 5 10.528 5c2.002 0 3.714.804 4.863 1.524.207.13.402.26.583.39.181-.13.376-.26.584-.39C17.706 5.804 19.418 5 21.42 5A7.58 7.58 0 0129 12.58c0 1.732-.703 3.389-1.577 4.812-.89 1.45-2.076 2.846-3.306 4.102-2.46 2.514-5.3 4.676-6.913 5.827zM16.093 9.55c.544-.52 2.723-2.428 5.327-2.428a5.459 5.459 0 015.459 5.459c0 4.702-7.772 10.775-10.908 13.016-3.21-2.283-10.85-8.314-10.85-13.016 0-3.015 2.392-5.459 5.407-5.459 2.604 0 4.783 1.909 5.327 2.428.06.057.1.098.12.117.018-.02.058-.06.118-.117z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWHeartFilled: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M14.742 27.824a2.121 2.121 0 002.462-.003c1.612-1.151 4.453-3.313 6.913-5.827 1.23-1.256 2.415-2.653 3.306-4.102C28.297 16.47 29 14.812 29 13.08a7.58 7.58 0 00-7.58-7.58c-2.002 0-3.714.804-4.863 1.524-.207.13-.402.26-.583.39a12.42 12.42 0 00-.583-.39c-1.149-.72-2.86-1.524-4.863-1.524C6.315 5.5 3 8.92 3 13.08c0 1.724.688 3.374 1.552 4.797.878 1.447 2.05 2.84 3.269 4.095 2.438 2.511 5.266 4.675 6.921 5.852z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWHelp: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M16 30c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16s6.268 14 14 14zm-3.982-17.702a.466.466 0 00.478.495h.971c.282 0 .503-.235.547-.513a2.75 2.75 0 01.12-.48c.11-.317.278-.606.491-.85.228-.264.506-.467.815-.596.297-.124.614-.176.93-.153a.659.659 0 00.08 0c.292-.014.584.033.86.14.287.11.552.284.779.51.202.215.36.475.465.762.105.288.153.596.141.905.007.426-.072.848-.232 1.236-.194.396-.454.75-.768 1.04l-1.339 1.098c-.436.388-.805.86-1.089 1.392a3.693 3.693 0 00-.339 1.648v.755a.5.5 0 00.5.5h1.107a.5.5 0 00.5-.5v-.638a2.11 2.11 0 01.238-.96c.146-.277.352-.511.599-.681a.583.583 0 00.071-.057l1.02-.969.732-.687c.236-.245.451-.515.643-.804.215-.336.384-.707.5-1.098.11-.427.163-.87.16-1.314a4.584 4.584 0 00-.299-1.755 4.24 4.24 0 00-.932-1.462c-.924-.875-2.12-1.325-3.34-1.255a4.654 4.654 0 00-1.91.392 3.785 3.785 0 00-1.41 1.08c-.354.451-.632.97-.82 1.529-.142.416-.232.85-.269 1.29zm2.665 11.753c.071.193.18.367.317.51.276.246.628.458.982.434l.071-.002c.392.003.773-.15 1.071-.432.142-.142.256-.314.332-.507.077-.192.116-.4.115-.611a1.68 1.68 0 00-.119-.61 1.558 1.558 0 00-.328-.508 1.542 1.542 0 00-1.107-.451 1.297 1.297 0 00-.55.112 1.408 1.408 0 00-.467.339c-.135.145-.24.32-.311.512-.07.192-.105.398-.1.606-.008.207.024.415.095.608z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWHome: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M3.725 16.286l1.84-1.666V28.5a2 2 0 002 2h16.871a2 2 0 002-2V14.65l1.824 1.636c.218.195.57.195.788 0l.789-.707a.464.464 0 000-.707L16.438 2.853a.6.6 0 00-.498-.137.59.59 0 00-.496.137L2.162 14.872a.467.467 0 000 .707l.781.707a.594.594 0 00.782 0z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWInfoEmpty: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M17 21.61c0 .343-.336.621-.75.621h-.5c-.415 0-.75-.278-.75-.622v-7.05c0-.344.335-.623.75-.623h.5c.414 0 .75.279.75.622v7.051zM14.667 11.102a1.334 1.334 0 112.667 0 1.334 1.334 0 01-2.667 0z"></path>
        <path
          fill-rule="evenodd"
          d="M16 28c6.627 0 12-5.373 12-12S22.627 4 16 4 4 9.373 4 16s5.373 12 12 12zm0 2c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16s6.268 14 14 14z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWInfoFilled: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M30 16c0 7.732-6.268 14-14 14S2 23.732 2 16 8.268 2 16 2s14 6.268 14 14zm-15.334-4.898a1.334 1.334 0 112.668 0 1.334 1.334 0 01-2.668 0zM16.25 22.34c.414 0 .75-.278.75-.622v-7.051c0-.344-.336-.622-.75-.622h-.5c-.414 0-.75.278-.75.622v7.051c0 .344.336.622.75.622h.5z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWJar: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M8 2.5a3 3 0 00-1.94 5.288A3.986 3.986 0 005 10.5v17a3 3 0 003 3h16a3 3 0 003-3v-17c0-1.046-.402-2-1.06-2.712A3 3 0 0024 2.5H8zm15 6H9a2 2 0 00-2 2v17a1 1 0 001 1h16a1 1 0 001-1v-17a2 2 0 00-2-2zm0-2h1a1 1 0 100-2H8a1 1 0 000 2h15z"
          clip-rule="evenodd"
        ></path>
        <path d="M19 18.5a3 3 0 11-6 0 3 3 0 016 0zM15.026 24.5a3 3 0 11-6 0 3 3 0 016 0zM22.974 24.5a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    );
  },
};

export const CWLock: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M15.975 5.369a6.37 6.37 0 00-6.37 6.37v1.62h12.789v-1.572a6.418 6.418 0 00-6.419-6.418zm-8.37 6.37v1.62H6.5a.5.5 0 00-.5.5v15.683a.5.5 0 00.5.5h19a.5.5 0 00.5-.5V13.858a.5.5 0 00-.5-.5h-1.106v-1.57c0-4.65-3.77-8.42-8.419-8.42a8.37 8.37 0 00-8.37 8.37zm10.552 6.835c0 .938-.598 1.736-1.434 2.033l.954 3.198a.5.5 0 01-.48.643h-2.394a.5.5 0 01-.48-.643l.955-3.197a2.158 2.158 0 112.879-2.034z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWLogout: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M11.901 3.5a1 1 0 011-1h15.52a1 1 0 011 1v26a1 1 0 01-1 1h-15.52a1 1 0 110-2h14.52v-24h-14.52a1 1 0 01-1-1zM4.536 17.417a1.2 1.2 0 010-1.834l.645.764.003.004m1.366.149l4.627-3.905a1 1 0 00-1.29-1.529l-5.35 4.517.644.764m1.37.153l4.626 3.905a1 1 0 11-1.29 1.528l-5.35-4.516"
          clip-rule="evenodd"
        ></path>
        <path
          fill-rule="evenodd"
          d="M21.662 16.5a1 1 0 01-1 1H4.999a1 1 0 110-2h15.663a1 1 0 011 1z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWMail: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M5 5.5a3 3 0 00-3 3v16a3 3 0 003 3h22a3 3 0 003-3v-16a3 3 0 00-3-3H5zM4 8.914V24.5a1 1 0 001 1h22a1 1 0 001-1V8.914l-9.879 9.879a3 3 0 01-4.242 0L4 8.914zM26.586 7.5H5.414l9.879 9.879a1 1 0 001.414 0L26.586 7.5z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWPeople: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M17.18 18.244a3.998 3.998 0 00-1.555-7.68 3.997 3.997 0 00-1.552 7.68 6.501 6.501 0 00-4.926 5.81c-.021.275.204.5.48.5h12a.472.472 0 00.482-.5 6.501 6.501 0 00-4.93-5.81z"></path>
        <path
          fill-rule="evenodd"
          d="M26.622 12.56a3.998 3.998 0 01-2.443 3.684 6.501 6.501 0 014.93 5.81c.02.275-.205.5-.481.5h-6.29a7.014 7.014 0 00-3.962-4.436 4.522 4.522 0 001.111-1.253 6.46 6.46 0 011.586-.62 3.998 3.998 0 01-1.067-.665 4.508 4.508 0 00-1.201-4.2 3.999 3.999 0 017.817 1.18zm-7.951-.588a3.981 3.981 0 01.908 3.177 3.981 3.981 0 01-.908-3.177zm-1.023 6.406a6.464 6.464 0 00-1.501 3.675c-.021.276.205.5.48.5h5.187a6.515 6.515 0 00-4.166-4.175zM11.244 15.58a4 4 0 01-1.065.664 6.457 6.457 0 011.58.616c.29.487.67.914 1.117 1.26a7.015 7.015 0 00-3.958 4.433h-6.29a.472.472 0 01-.481-.5 6.501 6.501 0 014.926-5.808 3.998 3.998 0 115.372-4.865 4.508 4.508 0 00-1.201 4.2zm2.363 2.798a6.515 6.515 0 00-4.165 4.175h5.186a.472.472 0 00.48-.5 6.464 6.464 0 00-1.501-3.675zm-1.028-6.406a3.981 3.981 0 01-.908 3.177 3.981 3.981 0 01.908-3.177z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWPerson: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M19.114 17.873A8.002 8.002 0 0016.004 2.5a8 8 0 00-3.107 15.374C7.37 19.23 3.233 24.114 3.01 30c-.01.276.214.501.49.501h25.018a.486.486 0 00.49-.5c-.222-5.889-4.364-10.774-9.894-12.127z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWPin: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="33"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M7 18a.5.5 0 01.5-.5h17a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-17A.5.5 0 017 19v-1z"></path>
        <path d="M16.5 7.5c.276 0 .5.275.5.615v20.902c0 .615-.724 1.483-1 1.483s-1-.868-1-1.483V8.115c0-.34.224-.615.5-.615h1zM9 3c0-.276.174-.5.389-.5H22.61c.215 0 .389.224.389.5v1c0 .276-.174.5-.389.5H9.39C9.174 4.5 9 4.276 9 4V3z"></path>
        <path d="M10.556 2.5h10.888L23 19.5H9l1.556-17z"></path>
      </svg>
    );
  },
};

export const CWPlus: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M2 16c0-.276.348-.5.778-.5h26.444c.43 0 .778.224.778.5v1c0 .276-.348.5-.778.5H2.778c-.43 0-.778-.224-.778-.5v-1z"></path>
        <path d="M16.5 2.5c.276 0 .5.348.5.778v26.444c0 .43-.224.778-.5.778h-1c-.276 0-.5-.348-.5-.778V3.278c0-.43.224-.778.5-.778h1z"></path>
      </svg>
    );
  },
};

export const CWPlusCircle: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M30 16.5c0 7.732-6.268 14-14 14s-14-6.268-14-14 6.268-14 14-14 14 6.268 14 14zm-25-.393c0-.217.274-.393.611-.393h9.603V6.111c0-.337.176-.611.393-.611h.786c.217 0 .393.274.393.611v9.603h9.603c.337 0 .611.176.611.393v.786c0 .217-.274.393-.611.393h-9.603v9.603c0 .337-.176.611-.393.611h-.786c-.217 0-.393-.274-.393-.611v-9.603H5.611c-.337 0-.611-.176-.611-.393v-.786z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWSearch: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M25.605 14.866c0 5.93-4.807 10.737-10.738 10.737-5.93 0-10.737-4.807-10.737-10.737S8.937 4.128 14.868 4.128c5.93 0 10.737 4.808 10.737 10.738zm-2.548 9.756a12.686 12.686 0 01-8.19 2.981C7.833 27.603 2.13 21.9 2.13 14.866c0-7.035 5.703-12.738 12.738-12.738 7.034 0 12.737 5.703 12.737 12.738 0 3.118-1.12 5.975-2.981 8.19l5.469 5.469c.096.096-.002.35-.218.565l-.783.784c-.216.216-.47.313-.566.217l-5.469-5.47z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWSend: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M27.432 17.105a.712.712 0 000-1.21L5.24 2.595c-.449-.27-1.01.067-1.01.604v11.103l13.804 1.504c.803.087.803 1.3 0 1.388L4.232 18.7V29.8c0 .537.56.873 1.009.604l22.19-13.3z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWShare: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M29.764 10.918a.482.482 0 000-.836L16.727 2.565a.483.483 0 00-.724.418v6.55a13.26 13.26 0 00-7.641 3.066c-3.565 2.989-6.26 8.376-6.356 17.398a.498.498 0 00.497.503h1c.277 0 .5-.227.503-.503.096-8.624 2.66-13.366 5.641-15.865a11.275 11.275 0 016.356-2.595v6.48c0 .371.402.603.724.418l13.037-7.517z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWShare2: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M11.53 8.898c.252-.432.396-.932.396-1.466 0-1.62-1.327-2.932-2.963-2.932C7.327 4.5 6 5.812 6 7.432c0 1.619 1.327 2.931 2.963 2.931.546 0 1.058-.146 1.497-.401v.017l9.658 5.517a2.926 2.926 0 000 1.008l-9.67 5.524v.003a2.974 2.974 0 00-1.485-.394C7.327 21.637 6 22.949 6 24.568c0 1.62 1.327 2.932 2.963 2.932 1.636 0 2.963-1.313 2.963-2.931 0-.534-.145-1.035-.397-1.466l9.205-5.259a2.97 2.97 0 002.303 1.088C24.674 18.932 26 17.619 26 16s-1.326-2.931-2.963-2.931c-.93 0-1.76.423-2.303 1.087l-9.205-5.258z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWStar: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M13.065 1.469c.326-.861 1.544-.861 1.87 0l1.422 3.753a1 1 0 001.483.482l3.357-2.2c.77-.506 1.755.21 1.513 1.099l-1.056 3.872a1 1 0 00.917 1.262l4.01.192c.919.044 1.295 1.203.577 1.779l-3.13 2.512a1 1 0 000 1.56l3.13 2.512c.718.576.342 1.735-.578 1.779l-4.009.192a1 1 0 00-.917 1.262l1.056 3.873c.242.888-.743 1.604-1.513 1.099l-3.357-2.201a1 1 0 00-1.483.482l-1.422 3.753c-.326.861-1.544.861-1.87 0l-1.422-3.753a1 1 0 00-1.484-.482l-3.356 2.2c-.77.506-1.755-.21-1.513-1.098l1.056-3.873a1 1 0 00-.917-1.262l-4.01-.192C.5 20.027.125 18.868.843 18.292l3.13-2.512a1 1 0 000-1.56l-3.13-2.512C.124 11.132.5 9.973 1.42 9.929l4.009-.192a1 1 0 00.917-1.262L5.29 4.603c-.242-.889.743-1.605 1.513-1.1l3.356 2.201a1 1 0 001.484-.482l1.422-3.753z"></path>
      </svg>
    );
  },
};

export const CWSun: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <circle cx="16" cy="16" r="8"></circle>
        <rect width="2" height="5" x="15" y="2" rx="0.5"></rect>
        <rect width="2" height="5" x="15" y="25" rx="0.5"></rect>
        <rect
          width="2"
          height="5"
          x="30"
          y="15"
          rx="0.5"
          transform="rotate(90 30 15)"
        ></rect>
        <rect
          width="2"
          height="5"
          x="7"
          y="15"
          rx="0.5"
          transform="rotate(90 7 15)"
        ></rect>
        <rect
          width="2"
          height="5"
          x="5.394"
          y="6.808"
          rx="0.5"
          transform="rotate(-45 5.394 6.808)"
        ></rect>
        <rect
          width="2"
          height="5"
          x="21.657"
          y="23.071"
          rx="0.5"
          transform="rotate(-45 21.657 23.071)"
        ></rect>
        <rect
          width="2"
          height="5"
          x="25.192"
          y="5.393"
          rx="0.5"
          transform="rotate(45 25.192 5.393)"
        ></rect>
        <rect
          width="2"
          height="5"
          x="8.929"
          y="21.657"
          rx="0.5"
          transform="rotate(45 8.929 21.657)"
        ></rect>
      </svg>
    );
  },
};

export const CWTelegram: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M25.232 28.084l4.752-22.857a.76.76 0 00-1.019-.864L2.487 14.578c-.653.251-.648 1.177.008 1.422l6.451 2.408 2.498 8.031a.76.76 0 001.206.363l3.596-2.931a1.072 1.072 0 011.308-.037l6.487 4.71a.76.76 0 001.19-.46zm-14.19-10.958L23.65 9.36c.227-.139.46.168.265.348L13.51 19.381c-.366.34-.601.796-.668 1.29l-.355 2.628c-.047.35-.54.385-.636.046l-1.364-4.79a1.27 1.27 0 01.555-1.429z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWTrash: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M7.119 11.612A2 2 0 019.116 9.5h13.768a2 2 0 011.997 2.112l-.9 16a2 2 0 01-1.997 1.888H10.016a2 2 0 01-1.997-1.888l-.9-16z"></path>
        <path
          fill-rule="evenodd"
          d="M16 4.5a2 2 0 00-2 2H8a1 1 0 000 2h16a1 1 0 100-2h-6a2 2 0 00-2-2zM9.917 12.504a1 1 0 011.08.913l1 12a1 1 0 11-1.994.166l-1-12a1 1 0 01.914-1.08zM22.083 12.504a1 1 0 00-1.08.913l-1 12a1 1 0 101.994.166l1-12a1 1 0 00-.914-1.08zM16 12.5a1 1 0 00-1 1v12a1 1 0 102 0v-12a1 1 0 00-1-1z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWTreasuryProposal: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M2 6.5a2 2 0 012-2h4v9H2v-7zm8 7h12v-9H10v9zm14 0v-9h4a2 2 0 012 2v7h-6zM8 15.5H2v11a2 2 0 002 2h4v-13zm2 13h12v-13h-4.268c.17.294.268.636.268 1v2a2 2 0 11-4 0v-2c0-.364.097-.706.268-1H10v13zm14 0h4a2 2 0 002-2v-11h-6v13z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWTwitter: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M28.553 8.978c.02.306.02.613.02.919 0 9.34-6.517 20.103-18.428 20.103-3.67 0-7.078-1.16-9.946-3.172.522.066 1.023.088 1.564.088 3.028 0 5.815-1.116 8.041-3.02-2.847-.065-5.233-2.1-6.056-4.9.401.067.803.11 1.224.11.581 0 1.163-.087 1.704-.24-2.968-.657-5.194-3.5-5.194-6.935v-.087a6.119 6.119 0 002.928.897c-1.744-1.27-2.887-3.435-2.887-5.885 0-1.312.32-2.515.882-3.565 3.188 4.287 7.98 7.087 13.355 7.393a8.668 8.668 0 01-.16-1.618C15.6 5.172 18.486 2 22.075 2c1.865 0 3.55.853 4.732 2.231a12.125 12.125 0 004.11-1.706c-.48 1.64-1.503 3.019-2.846 3.894 1.303-.153 2.566-.547 3.73-1.094a14.679 14.679 0 01-3.25 3.653z"></path>
      </svg>
    );
  },
};

export const CWUpvote: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M15.27 4.172a.843.843 0 011.46 0l13.156 22.81a.845.845 0 01-.731 1.268H2.845a.845.845 0 01-.73-1.267l13.154-22.81z"></path>
      </svg>
    );
  },
};

export const CWViews: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M22 16a6 6 0 11-12 0 6 6 0 0112 0z"></path>
        <path
          fill-rule="evenodd"
          d="M24.907 19.92C27.144 18.642 28 17.182 28 16s-.856-2.642-3.093-3.92C22.727 10.834 19.582 10 16 10s-6.727.834-8.907 2.08C4.856 13.358 4 14.818 4 16s.856 2.642 3.093 3.92C9.273 21.166 12.418 22 16 22s6.727-.834 8.907-2.08zM16 24c7.732 0 14-3.582 14-8s-6.268-8-14-8-14 3.582-14 8 6.268 8 14 8z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWWallet: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M5 5.5a1 1 0 00-1 1v6.798a1 1 0 11-2 0V6.5a3 3 0 013-3h23a1 1 0 110 2H5z"
          clip-rule="evenodd"
        ></path>
        <path
          fill-rule="evenodd"
          d="M5 7.5a3 3 0 00-3 3v16a3 3 0 003 3h22a3 3 0 003-3v-16a3 3 0 00-3-3H5zm14 8a2 2 0 00-2 2v2a2 2 0 002 2h9v-6h-9z"
          clip-rule="evenodd"
        ></path>
        <path d="M27.145 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
      </svg>
    );
  },
};

export const CWWebsite: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { componentType, onclick, ...iconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<IconStyleAttrs>({ ...iconStyleAttrs }, componentType)}
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        fill="none"
        viewBox="0 0 30 30"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M18.011 15.459a.2.2 0 00.2-.203 57.497 57.497 0 00-.293-5.119.2.2 0 00-.199-.178h-3.503a.2.2 0 00-.198.178 57.497 57.497 0 00-.293 5.12.2.2 0 00.2.202h4.086zm1.9 0a.2.2 0 01-.2-.198 59.446 59.446 0 00-.281-5.081.2.2 0 01.2-.221h3.46c.086 0 .162.054.19.136.51 1.558.833 3.301.916 5.157a.199.199 0 01-.199.207h-4.086zM19.2 8.286a.2.2 0 00.199.173h2.936c.146 0 .242-.15.18-.282-.25-.52-.521-1.008-.813-1.462-.935-1.455-2.053-2.524-3.265-3.142-.16-.082-.326.082-.264.25.245.663.462 1.45.65 2.329.14.654.267 1.369.378 2.134zm6.7 7.173a.201.201 0 01-.2-.194 21.196 21.196 0 00-.812-5.047.202.202 0 01.193-.26h3.295c.076 0 .145.043.179.111a13.917 13.917 0 011.382 5.18.198.198 0 01-.198.21h-3.839zm-1.673-7.125a.201.201 0 00.185.125h2.845c.16 0 .254-.178.162-.308a14.049 14.049 0 00-6.132-4.897c-.21-.087-.376.215-.209.37.698.647 1.331 1.417 1.886 2.28.475.74.899 1.554 1.263 2.43zM14.58 6.466a29.903 29.903 0 00-.32 1.764.199.199 0 00.198.229h3.02a.2.2 0 00.197-.23 29.9 29.9 0 00-.32-1.763c-.265-1.24-.572-2.193-.889-2.818-.158-.314-.301-.507-.412-.613a.124.124 0 00-.173 0c-.11.106-.253.3-.412.613-.317.625-.623 1.578-.89 2.818zm-1.467-.314a32.23 32.23 0 00-.377 2.134.2.2 0 01-.198.173H9.6a.197.197 0 01-.179-.282c.249-.52.52-1.008.813-1.462.935-1.455 2.053-2.524 3.265-3.142.16-.082.326.082.264.25a17.21 17.21 0 00-.65 2.329zm-5.175 9.307a.199.199 0 01-.199-.207c.084-1.856.407-3.599.917-5.157a.199.199 0 01.19-.136h3.46a.2.2 0 01.2.22 59.405 59.405 0 00-.281 5.082.2.2 0 01-.2.198H7.937zm-1.901 0a.201.201 0 00.2-.194c.074-1.783.356-3.485.811-5.047a.202.202 0 00-.193-.26H3.561a.198.198 0 00-.179.111A13.916 13.916 0 002 15.25a.198.198 0 00.199.21h3.838zm2.936-9.555c-.476.74-.9 1.554-1.263 2.43a.201.201 0 01-.186.125H4.68a.196.196 0 01-.162-.308 14.048 14.048 0 016.131-4.897c.21-.086.376.215.209.37a11.813 11.813 0 00-1.885 2.28zm8.505 18.055a.2.2 0 01.197.228c-.096.631-.203 1.221-.32 1.764-.265 1.24-.572 2.194-.889 2.819-.158.313-.301.506-.412.612a.124.124 0 01-.173 0c-.11-.106-.253-.299-.412-.613-.317-.624-.623-1.578-.89-2.818a29.9 29.9 0 01-.318-1.764.199.199 0 01.197-.228h3.02zm1.92 0a.2.2 0 00-.198.172c-.111.765-.237 1.48-.378 2.134a17.18 17.18 0 01-.65 2.329c-.062.168.104.332.264.25 1.212-.617 2.33-1.687 3.265-3.141.292-.455.564-.944.813-1.463a.197.197 0 00-.18-.281h-2.936zm3.881-1.637a.199.199 0 01-.189.137h-3.46a.2.2 0 01-.2-.221 59.45 59.45 0 00.281-5.082.2.2 0 01.2-.197h4.086c.114 0 .204.094.2.207a19.426 19.426 0 01-.918 5.156zm1.132 1.637a.201.201 0 00-.185.124c-.364.876-.788 1.69-1.263 2.43a11.81 11.81 0 01-1.885 2.28c-.168.155-.002.457.208.37a14.048 14.048 0 006.132-4.896.196.196 0 00-.162-.308H24.41zm4.143-1.611a.198.198 0 01-.179.11H25.08a.202.202 0 01-.193-.259c.456-1.562.738-3.264.811-5.047a.201.201 0 01.201-.193h3.838c.115 0 .206.096.199.21a13.917 13.917 0 01-1.382 5.179zm-10.636-.068a.2.2 0 01-.199.179h-3.503a.2.2 0 01-.198-.179 57.497 57.497 0 01-.293-5.119.2.2 0 01.2-.202h4.086a.2.2 0 01.2.202 57.497 57.497 0 01-.293 5.12zm-5.612.179a.2.2 0 00.2-.221 59.41 59.41 0 01-.281-5.082.2.2 0 00-.2-.197H7.937a.199.199 0 00-.199.207c.084 1.855.407 3.598.917 5.156a.199.199 0 00.19.137h3.46zm-2.705 1.5a.197.197 0 00-.179.28c.249.52.52 1.01.813 1.464.935 1.454 2.053 2.524 3.265 3.142.16.081.326-.083.264-.251a17.21 17.21 0 01-.65-2.329 32.223 32.223 0 01-.378-2.134.2.2 0 00-.198-.172H9.6zm-2.077 0c.082 0 .155.049.186.124.364.876.787 1.69 1.263 2.43a11.812 11.812 0 001.885 2.28c.167.155.002.456-.21.37a14.049 14.049 0 01-6.13-4.896.196.196 0 01.163-.308h2.843zm-.669-1.5c.135 0 .231-.13.193-.26a21.196 21.196 0 01-.81-5.047.201.201 0 00-.201-.193H2.199a.198.198 0 00-.199.21 13.917 13.917 0 001.382 5.179c.034.068.103.11.179.11h3.294z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CommonLogo: m.Component = {
  view: (vnode) => {
    return (
      <svg
        width="206"
        height="30"
        viewBox="0 0 206 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M53.0137 24.2856C51.5014 23.4125 50.253 22.1471 49.4002 20.6232C48.5034 19.0454 48.042 17.2576 48.0632 15.4428C48.0431 13.6301 48.5045 11.8445 49.4002 10.2684C50.2557 8.74178 51.5031 7.47121 53.0137 6.58796C54.5748 5.68873 56.3494 5.22679 58.1508 5.2507C59.6555 5.24115 61.1432 5.5684 62.5051 6.20848C63.8255 6.81695 64.9832 7.7293 65.8836 8.87095C66.7593 9.95774 67.3197 11.2642 67.5037 12.6478H62.9447C62.6813 11.7082 62.0668 10.9059 61.2283 10.407C60.3106 9.81906 59.2406 9.51328 58.1508 9.52753C57.1311 9.51328 56.1277 9.78452 55.254 10.3106C54.3873 10.8221 53.6755 11.559 53.1943 12.443C52.6804 13.3628 52.4167 14.4013 52.4295 15.4548C52.4151 16.4991 52.6791 17.5283 53.1943 18.4366C53.6792 19.3147 54.3904 20.0469 55.254 20.5569C56.1295 21.0783 57.132 21.3472 58.1508 21.334C59.2593 21.351 60.3469 21.0318 61.2704 20.4184C62.1204 19.8766 62.7337 19.0329 62.9868 18.0571H67.5458C67.3913 19.4774 66.845 20.8268 65.968 21.9544C65.07 23.1173 63.902 24.0436 62.5653 24.653C61.1824 25.294 59.6749 25.621 58.1508 25.6108C56.3515 25.6305 54.579 25.1733 53.0137 24.2856Z"
          fill="#4D484F"
        />
        <path
          d="M58.1444 25.8755C56.3019 25.8953 54.4866 25.4299 52.8808 24.5262C51.3238 23.6327 50.0361 22.3364 49.1529 20.7734C48.2361 19.1562 47.7624 17.3255 47.7798 15.4665C47.7623 13.6094 48.236 11.7807 49.1529 10.1656C50.039 8.60014 51.3257 7.29867 52.8808 6.39482C54.4818 5.47718 56.2993 5.00504 58.1444 5.02743C59.6857 5.01932 61.2097 5.35257 62.607 6.00327C63.9605 6.63221 65.1484 7.56868 66.076 8.73804C66.9752 9.86406 67.5518 11.2132 67.7442 12.6414L67.7803 12.9245H62.7456L62.6974 12.7378C62.4538 11.855 61.8745 11.1026 61.0834 10.6415C60.2074 10.0787 59.1855 9.78549 58.1444 9.7982C57.1698 9.78704 56.2111 10.0455 55.3741 10.5451C54.548 11.0389 53.8683 11.7437 53.4047 12.5872C52.9187 13.4685 52.6677 14.4601 52.676 15.4665C52.6647 16.4657 52.916 17.4503 53.4047 18.3217C53.8728 19.1587 54.5517 19.8586 55.3741 20.3517C56.2117 20.8499 57.17 21.1083 58.1444 21.0987C59.2026 21.1164 60.2409 20.8095 61.1195 20.2192C61.9218 19.7161 62.5014 18.9252 62.7395 18.0085L62.7877 17.8158H67.8165L67.7864 18.0989C67.6274 19.5631 67.0644 20.9542 66.1603 22.1167C65.2297 23.3092 64.0253 24.2597 62.6492 24.8876C61.2375 25.5412 59.7 25.8783 58.1444 25.8755ZM58.1444 5.5274C56.3889 5.50062 54.6584 5.94581 53.1337 6.81647C51.6503 7.68338 50.4256 8.9312 49.5865 10.4307C48.7127 11.9683 48.2618 13.71 48.2796 15.4786C48.261 17.2491 48.712 18.9929 49.5865 20.5324C50.4258 22.0193 51.6515 23.2514 53.1337 24.0985C54.6605 24.964 56.3896 25.4088 58.1444 25.3875C59.6335 25.3967 61.1062 25.0758 62.4565 24.4478C63.7538 23.854 64.8882 22.955 65.7628 21.8275C66.5506 20.8102 67.0629 19.6069 67.2504 18.3338H63.1732C62.8722 19.2886 62.2456 20.1073 61.4026 20.6469C60.4395 21.2914 59.3031 21.6276 58.1444 21.6107C57.0858 21.6155 56.0455 21.3346 55.1332 20.7975C54.2349 20.2596 53.4935 19.4952 52.9832 18.5808C52.4526 17.6338 52.1806 16.564 52.1942 15.4786C52.1844 14.3879 52.4561 13.3131 52.9832 12.3583C53.4913 11.4391 54.2329 10.6703 55.1332 10.1295C56.0432 9.58639 57.0847 9.30306 58.1444 9.31029C59.2812 9.29887 60.3967 9.61915 61.3544 10.2319C62.1893 10.7312 62.8175 11.5135 63.125 12.4366H67.2082C66.9839 11.1945 66.4518 10.0285 65.6604 9.04524C64.7792 7.93681 63.6511 7.0498 62.3662 6.45505C61.0436 5.84105 59.6025 5.52441 58.1444 5.5274Z"
          fill="#4D484F"
        />
        <path
          d="M74.6166 24.2857C73.0929 23.4141 71.829 22.1519 70.9549 20.6294C70.0572 19.0585 69.5956 17.2763 69.618 15.4671C69.5978 13.6543 70.0592 11.8687 70.9549 10.2927C71.8246 8.76054 73.0891 7.4896 74.6166 6.61221C76.1852 5.71508 77.965 5.2534 79.7718 5.27495C81.5668 5.25635 83.3342 5.71804 84.8909 6.61221C86.4207 7.4907 87.6888 8.76113 88.5646 10.2927C89.4761 11.8633 89.9464 13.6511 89.9257 15.4671C89.9487 17.2795 89.4782 19.064 88.5646 20.6294C87.6845 22.1514 86.4169 23.413 84.8909 24.2857C83.3342 25.1799 81.5668 25.6416 79.7718 25.623C77.965 25.6446 76.1852 25.1829 74.6166 24.2857ZM74.7371 18.4488C75.232 19.3314 75.9561 20.064 76.8329 20.5691C77.7251 21.0871 78.7402 21.3555 79.7718 21.3462C80.7979 21.357 81.8076 21.0884 82.6927 20.5691C83.5641 20.0571 84.2866 19.3261 84.7885 18.4488C85.315 17.5443 85.5856 16.5136 85.5714 15.4671C85.5848 14.4111 85.3144 13.3709 84.7885 12.4552C84.2903 11.5719 83.5672 10.8362 82.6927 10.3228C81.8093 9.79886 80.7988 9.52796 79.7718 9.53973C78.7393 9.52956 77.7235 9.80023 76.8329 10.3228C75.9531 10.8293 75.2284 11.5667 74.7371 12.4552C74.2271 13.3763 73.9655 14.4142 73.9782 15.4671C73.9646 16.5104 74.2264 17.5389 74.7371 18.4488Z"
          fill="#4D484F"
        />
        <path
          d="M79.7716 25.8763C77.9204 25.8952 76.0975 25.4212 74.4899 24.5029C72.9303 23.6075 71.6357 22.3147 70.7379 20.7562C69.821 19.1459 69.3491 17.3204 69.3708 15.4674C69.3513 13.6108 69.8229 11.782 70.7379 10.1665C71.6314 8.59846 72.9265 7.29686 74.4899 6.3957C76.098 5.47931 77.9209 5.00737 79.7716 5.02832C81.6105 5.01031 83.421 5.48227 85.0172 6.3957C86.5815 7.29977 87.8798 8.60044 88.7812 10.1665C89.7138 11.7762 90.1964 13.6071 90.1784 15.4674C90.1987 17.3242 89.7159 19.1518 88.7812 20.7562C87.8756 22.3128 86.5777 23.6046 85.0172 24.5029C83.4211 25.4174 81.6109 25.8914 79.7716 25.8763ZM79.7716 5.52829C78.0095 5.50663 76.2735 5.9558 74.7429 6.82941C73.2493 7.69126 72.0156 8.93978 71.1715 10.4436C70.2996 11.9817 69.8508 13.7235 69.8707 15.4915C69.8483 17.256 70.2973 18.9945 71.1715 20.5273C72.0241 22.0122 73.2568 23.2431 74.7429 24.0933C76.273 24.9688 78.0089 25.42 79.7716 25.4005C81.5224 25.4168 83.2459 24.9655 84.7642 24.0933C86.2598 23.2412 87.5057 22.0116 88.3777 20.5273C89.2647 18.9987 89.7225 17.2588 89.7026 15.4915C89.7225 13.7196 89.2626 11.9753 88.3717 10.4436C87.5214 8.94037 86.2841 7.69238 84.7883 6.82941C83.2625 5.95487 81.5301 5.50556 79.7716 5.52829ZM79.7716 21.5995C78.6958 21.6046 77.638 21.324 76.7062 20.7863C75.7921 20.2566 75.037 19.491 74.52 18.5696C73.9855 17.624 73.7112 16.5536 73.7251 15.4674C73.7151 14.376 73.9891 13.3007 74.52 12.3471C75.0314 11.4183 75.7875 10.6475 76.7062 10.1183C77.6364 9.57611 78.695 9.29321 79.7716 9.29912C80.8429 9.29019 81.8965 9.57341 82.819 10.1183C83.7297 10.6577 84.4833 11.4261 85.0051 12.3471C85.548 13.2967 85.8286 14.3736 85.8182 15.4674C85.8324 16.5559 85.5514 17.628 85.0051 18.5696C84.4797 19.4847 83.7266 20.2483 82.819 20.7863C81.8942 21.3252 80.8418 21.6061 79.7716 21.5995ZM79.7716 9.79909C78.7833 9.79125 77.8114 10.0515 76.9591 10.552C76.1193 11.0374 75.4263 11.7409 74.9536 12.5881C74.4676 13.4693 74.2166 14.461 74.2249 15.4674C74.2136 16.4665 74.4649 17.4511 74.9536 18.3226C75.4289 19.1663 76.1214 19.8672 76.9591 20.3526C77.8136 20.8472 78.7844 21.1051 79.7716 21.0996C80.7533 21.1065 81.7187 20.8485 82.566 20.3526C83.3989 19.8609 84.0899 19.1614 84.5715 18.3226C85.0742 17.456 85.3323 16.4692 85.3183 15.4674C85.3264 14.4606 85.0688 13.4695 84.5715 12.5941C84.0924 11.7486 83.4012 11.0427 82.566 10.546C81.7164 10.059 80.7507 9.81127 79.7716 9.82921V9.79909Z"
          fill="#4D484F"
        />
        <path
          d="M111.19 25.2254H106.715V14.1117C106.78 12.8599 106.367 11.6304 105.559 10.6721C105.176 10.2496 104.705 9.91593 104.18 9.69431C103.655 9.47269 103.087 9.36853 102.518 9.38909C101.591 9.38082 100.681 9.64016 99.8978 10.136C99.1438 10.5921 98.5293 11.2463 98.1212 12.0275V25.2254H93.6465V5.67247H98.1212V8.19639C98.7592 7.34887 99.5701 6.64666 100.5 6.13629C101.582 5.54268 102.802 5.24553 104.035 5.2749C106.757 5.2749 108.717 6.32704 109.913 8.43132C110.686 7.50759 111.628 6.74075 112.689 6.17243C113.8 5.57487 115.042 5.26623 116.303 5.2749C117.751 5.24213 119.183 5.58672 120.458 6.27484C121.643 6.92426 122.621 7.89252 123.283 9.06984C123.984 10.3626 124.335 11.8162 124.301 13.2864V25.2435H119.784V14.1117C119.856 12.8537 119.447 11.6155 118.64 10.648C118.241 10.2229 117.754 9.88993 117.213 9.67248C116.672 9.45503 116.09 9.35832 115.508 9.38909C114.612 9.40444 113.738 9.66936 112.985 10.1541C112.197 10.6229 111.538 11.2814 111.069 12.0696L111.184 12.7503L111.19 25.2254Z"
          fill="#4D484F"
        />
        <path
          d="M124.554 25.4906H119.537V14.1119C119.606 12.9179 119.223 11.7417 118.465 10.8169C118.087 10.4198 117.628 10.1092 117.118 9.90643C116.609 9.70368 116.062 9.61356 115.514 9.64227C114.659 9.6535 113.825 9.9039 113.105 10.3651C112.371 10.796 111.751 11.3972 111.298 12.118L111.401 12.7204V25.4906H106.42V14.1119C106.482 12.9231 106.093 11.7549 105.33 10.841C104.973 10.441 104.532 10.1254 104.039 9.91707C103.545 9.7087 103.011 9.61277 102.476 9.63624C101.596 9.62825 100.733 9.87286 99.9883 10.341C99.2892 10.7656 98.7156 11.3685 98.3261 12.0879V25.4906H93.3516V5.4317H98.3261V7.50385C98.9096 6.87959 99.5861 6.34927 100.332 5.93167C101.452 5.31583 102.715 5.0082 103.993 5.04016C106.667 5.04016 108.655 6.0401 109.907 8.01587C110.657 7.1847 111.546 6.48973 112.533 5.96179C113.68 5.34545 114.965 5.02847 116.267 5.04016C117.759 5.00899 119.234 5.36379 120.549 6.07021C121.771 6.74297 122.781 7.74456 123.464 8.96159C124.182 10.286 124.543 11.7744 124.512 13.2806L124.554 25.4906ZM120.037 24.9846H124.078V13.2685C124.109 11.8484 123.768 10.4449 123.09 9.19651C122.453 8.05871 121.51 7.1219 120.368 6.49188C119.128 5.83112 117.739 5.4993 116.333 5.52808C115.112 5.51695 113.909 5.81537 112.834 6.3955C111.8 6.94501 110.882 7.68958 110.13 8.58812L109.901 8.87124L109.721 8.558C108.564 6.51597 106.709 5.54615 104.059 5.54615C102.869 5.51702 101.691 5.80161 100.645 6.3714C99.7475 6.86604 98.9638 7.54319 98.3442 8.35922L97.8925 8.96159V5.94974H93.9177V24.9967H97.8925L97.9226 11.9373C98.3524 11.1155 98.9978 10.4262 99.7896 9.94345C100.614 9.42694 101.569 9.15729 102.542 9.16639C103.146 9.14858 103.747 9.26093 104.304 9.49581C104.861 9.7307 105.361 10.0826 105.77 10.5278C106.612 11.5378 107.042 12.8285 106.974 14.142V24.9846H110.949V12.7505L110.817 12.0216L110.865 11.9433C111.353 11.1181 112.041 10.4285 112.864 9.93742C113.658 9.42842 114.578 9.15288 115.52 9.1423C116.138 9.11183 116.754 9.21621 117.327 9.44818C117.9 9.68016 118.416 10.0342 118.839 10.4856C119.683 11.4945 120.113 12.786 120.043 14.0998L120.037 24.9846Z"
          fill="#4D484F"
        />
        <path
          d="M146.53 25.2252H142.055V14.1115C142.118 12.8591 141.702 11.6296 140.893 10.672C140.514 10.2521 140.049 9.91989 139.529 9.69831C139.009 9.47673 138.447 9.37115 137.882 9.38893C136.954 9.37824 136.044 9.63777 135.262 10.1359C134.497 10.5877 133.872 11.2423 133.455 12.0273V25.2252H128.98V5.67231H133.455V8.19623C134.103 7.34683 134.924 6.64467 135.864 6.13613C136.948 5.54256 138.17 5.24544 139.405 5.27474C142.119 5.27474 144.079 6.32687 145.283 8.43115C146.053 7.50471 146.996 6.73741 148.06 6.17227C149.17 5.5747 150.412 5.26606 151.673 5.27474C153.121 5.24362 154.553 5.58812 155.829 6.27468C157.01 6.92499 157.987 7.89317 158.647 9.06967C159.35 10.3616 159.701 11.8158 159.665 13.2863V25.2433H155.148V14.1115C155.219 12.8547 154.812 11.6177 154.01 10.6479C153.609 10.2229 153.121 9.89014 152.58 9.67274C152.038 9.45534 151.455 9.3585 150.872 9.38893C149.978 9.40283 149.106 9.66791 148.355 10.1539C147.565 10.6226 146.905 11.281 146.434 12.0695L146.554 12.7502L146.53 25.2252Z"
          fill="#4D484F"
        />
        <path
          d="M159.894 25.49H154.871V14.1113C154.94 12.9173 154.557 11.7411 153.799 10.8163C153.422 10.4182 152.962 10.107 152.453 9.90415C151.943 9.70132 151.396 9.61177 150.848 9.64169C149.993 9.65387 149.159 9.9042 148.439 10.3645C147.704 10.7947 147.085 11.396 146.632 12.1174L146.735 12.7198V25.49H141.76V14.1113C141.823 12.9214 141.431 11.7522 140.664 10.8404C140.308 10.4412 139.868 10.1261 139.375 9.9178C138.882 9.70946 138.35 9.61309 137.815 9.63566C136.936 9.62597 136.072 9.87071 135.328 10.3404C134.629 10.7651 134.055 11.3679 133.666 12.0873V25.49H128.691V5.43112H133.714V7.50327C134.297 6.878 134.973 6.34755 135.72 5.93109C136.835 5.3058 138.097 4.98777 139.375 5.00946C142.049 5.00946 144.031 6.0094 145.283 7.98517C146.038 7.15849 146.925 6.46416 147.909 5.93109C149.059 5.31523 150.345 4.99832 151.649 5.00946C153.139 4.97878 154.612 5.3336 155.925 6.03952C157.15 6.70887 158.16 7.71128 158.84 8.93089C159.561 10.2542 159.924 11.743 159.894 13.2499V25.49ZM155.377 24.9841H159.394V13.268C159.42 11.8579 159.08 10.4652 158.406 9.22605C157.769 8.08825 156.826 7.15143 155.684 6.52141C154.443 5.86141 153.054 5.52965 151.649 5.55762C150.437 5.54028 149.24 5.82821 148.168 6.39492C147.132 6.94119 146.213 7.68623 145.464 8.58754L145.229 8.87066L145.054 8.55742C143.892 6.51539 142.043 5.54557 139.393 5.54557C138.202 5.51644 137.025 5.80103 135.979 6.37082C135.08 6.86413 134.296 7.5415 133.678 8.35864L133.226 8.96101V5.94916H129.251V24.9961H133.226L133.256 11.9367C133.684 11.1137 134.33 10.424 135.123 9.94287C135.947 9.4248 136.903 9.15502 137.876 9.16581C138.479 9.14526 139.08 9.2564 139.637 9.49148C140.193 9.72657 140.692 10.08 141.098 10.5272C141.942 11.5358 142.373 12.8275 142.302 14.1414V24.9841H146.277V12.7499L146.15 12.021L146.199 11.9427C146.689 11.119 147.376 10.4297 148.198 9.93684C148.989 9.42862 149.908 9.1531 150.848 9.14172C151.466 9.11077 152.084 9.2149 152.658 9.44688C153.232 9.67885 153.749 10.0331 154.172 10.485C155.014 11.4954 155.444 12.7858 155.377 14.0992V24.9841Z"
          fill="#4D484F"
        />
        <path
          d="M168.32 24.2857C166.795 23.4159 165.53 22.1534 164.658 20.6293C163.76 19.0585 163.299 17.2762 163.321 15.467C163.301 13.6543 163.762 11.8687 164.658 10.2927C165.526 8.75907 166.791 7.48768 168.32 6.61219C169.884 5.71549 171.66 5.25377 173.463 5.27493C175.258 5.2572 177.025 5.71883 178.582 6.61219C180.111 7.4923 181.378 8.76234 182.256 10.2927C183.167 11.8633 183.638 13.6511 183.617 15.467C183.64 17.2794 183.169 19.064 182.256 20.6293C181.374 22.1499 180.107 23.4111 178.582 24.2857C177.025 25.1791 175.258 25.6407 173.463 25.623C171.66 25.6441 169.884 25.1824 168.32 24.2857ZM168.44 18.4488C168.932 19.334 169.657 20.0673 170.536 20.5691C171.425 21.085 172.435 21.3533 173.463 21.3462C174.487 21.3562 175.495 21.0876 176.378 20.5691C177.25 20.0557 177.974 19.3252 178.48 18.4488C179.001 17.5426 179.27 16.5127 179.257 15.467C179.269 14.412 179.001 13.3726 178.48 12.4552C177.977 11.5728 177.253 10.8376 176.378 10.3228C175.496 9.79961 174.488 9.52873 173.463 9.53971C172.43 9.52953 171.415 9.80021 170.524 10.3228C169.641 10.8258 168.916 11.564 168.428 12.4552C167.914 13.3749 167.65 14.4134 167.663 15.467C167.653 16.5123 167.921 17.5416 168.44 18.4488Z"
          fill="#4D484F"
        />
        <path
          d="M173.462 25.8757C171.611 25.8946 169.788 25.4205 168.18 24.5023C166.619 23.6087 165.324 22.3155 164.428 20.7556C163.51 19.1457 163.036 17.3203 163.055 15.4668C163.038 13.6097 163.512 11.7809 164.428 10.1659C165.32 8.59642 166.616 7.29437 168.18 6.39508C169.787 5.47238 171.61 4.99418 173.462 5.00963C175.299 4.99095 177.108 5.46299 178.702 6.37701C180.281 7.27906 181.591 8.5872 182.496 10.1659C183.424 11.7772 183.904 13.6074 183.887 15.4668C183.909 17.323 183.428 19.1506 182.496 20.7556C181.595 22.316 180.296 23.609 178.732 24.5023C177.129 25.4228 175.31 25.8971 173.462 25.8757ZM173.462 5.52767C171.703 5.50371 169.969 5.94864 168.439 6.81674C166.949 7.68109 165.718 8.92914 164.874 10.431C164.002 11.9691 163.553 13.7108 163.573 15.4788C163.551 17.2433 164 18.9818 164.874 20.5146C165.725 21.9987 166.956 23.2296 168.439 24.0807C169.969 24.9498 171.703 25.3967 173.462 25.3758C175.213 25.392 176.936 24.9408 178.455 24.0686C179.952 23.2187 181.198 21.9886 182.068 20.5026C182.955 18.974 183.413 17.2341 183.393 15.4668C183.412 13.6957 182.954 11.9522 182.068 10.4189C181.206 8.91445 179.959 7.66692 178.455 6.80469C176.934 5.94272 175.21 5.50192 173.462 5.52767ZM173.462 21.5989C172.386 21.604 171.328 21.3234 170.397 20.7857C169.481 20.2577 168.726 19.4917 168.21 18.569C167.685 17.6209 167.419 16.5507 167.44 15.4668C167.433 14.3757 167.706 13.3012 168.235 12.3465C168.75 11.4187 169.508 10.6484 170.427 10.1177C171.348 9.58067 172.396 9.29796 173.462 9.2985C174.521 9.29432 175.562 9.57743 176.473 10.1177C177.387 10.6547 178.144 11.4235 178.665 12.3465C179.206 13.2972 179.486 14.3733 179.478 15.4668C179.49 16.555 179.209 17.6262 178.665 18.569C178.139 19.4856 177.384 20.2496 176.473 20.7857C175.56 21.32 174.52 21.6008 173.462 21.5989ZM173.462 9.82859C172.475 9.82131 171.503 10.0793 170.65 10.5755C169.814 11.0559 169.122 11.7504 168.644 12.5874C168.155 13.4676 167.904 14.46 167.915 15.4668C167.901 16.4663 168.153 17.4516 168.644 18.322C169.115 19.1688 169.809 19.8707 170.65 20.352C171.504 20.8466 172.475 21.1045 173.462 21.0989C174.442 21.1066 175.406 20.8485 176.25 20.352C177.09 19.8614 177.79 19.1622 178.28 18.322C178.78 17.4542 179.038 16.4682 179.027 15.4668C179.035 14.46 178.777 13.4688 178.28 12.5935C177.797 11.7491 177.104 11.0437 176.269 10.5454C175.416 10.0545 174.445 9.80663 173.462 9.82859Z"
          fill="#4D484F"
        />
        <path
          d="M191.819 8.27439C192.446 7.33414 193.308 6.57412 194.319 6.06971C195.38 5.53755 196.552 5.26504 197.739 5.27459C198.827 5.2222 199.912 5.40799 200.92 5.81897C201.928 6.22996 202.834 6.85621 203.575 7.65395C205.017 9.24019 205.735 11.3786 205.731 14.0692V25.2251H201.299V14.792C201.374 13.4343 200.921 12.1 200.034 11.0694C199.602 10.6151 199.077 10.259 198.495 10.0252C197.913 9.79133 197.288 9.68523 196.661 9.71405C195.695 9.70638 194.744 9.95363 193.903 10.4309C193.059 10.9028 192.343 11.5751 191.819 12.3886V25.2251H187.345V5.67216H191.819V8.27439Z"
          fill="#4D484F"
        />
        <path
          d="M205.984 25.4904H201.052V14.7863C201.121 13.4946 200.69 12.2259 199.847 11.2444C199.438 10.8153 198.941 10.4788 198.39 10.2575C197.84 10.0362 197.248 9.93524 196.655 9.96132C195.732 9.95794 194.823 10.1946 194.018 10.648C193.233 11.0863 192.564 11.7059 192.066 12.4551V25.4904H187.092V5.43149H192.066V7.53377C192.659 6.83891 193.386 6.27131 194.204 5.8652C195.298 5.30344 196.51 5.01023 197.74 5.00983C198.861 4.95861 199.981 5.15187 201.021 5.57623C202.061 6.00058 202.996 6.6459 203.762 7.4675C205.237 9.10595 205.984 11.3227 205.984 14.0454V25.4904ZM201.552 24.9844H205.484V14.0454C205.484 11.4311 204.78 9.32883 203.389 7.79881C202.67 7.02961 201.792 6.42595 200.816 6.02967C199.841 5.63339 198.791 5.45395 197.74 5.50378C196.593 5.49656 195.46 5.75858 194.433 6.26878C193.46 6.75266 192.63 7.4813 192.024 8.38311L191.566 9.08185V5.90134H187.592V24.9483H191.566V12.2985L191.609 12.2383C192.15 11.3896 192.893 10.6881 193.771 10.1962C194.65 9.69785 195.645 9.43826 196.655 9.44328C197.317 9.41631 197.977 9.53077 198.59 9.77903C199.204 10.0273 199.758 10.4036 200.215 10.8829C201.141 11.9591 201.617 13.3503 201.546 14.7682L201.552 24.9844Z"
          fill="#4D484F"
        />
        <path
          d="M14.0502 15.1894C14.0608 13.1403 14.5277 11.1194 15.4167 9.27431C16.3057 7.42923 17.5945 5.80656 19.1889 4.52477L16.0367 1.36392C15.5823 0.908494 14.9662 0.652649 14.3238 0.652649C13.6814 0.652649 13.0652 0.908494 12.6109 1.36392L0.724947 13.2824C0.270762 13.738 0.015625 14.3558 0.015625 15C0.015625 15.6442 0.270762 16.262 0.724947 16.7176L12.6109 28.6361C13.0652 29.0915 13.6814 29.3473 14.3238 29.3473C14.9662 29.3473 15.5823 29.0915 16.0367 28.6361L18.9479 25.7103C17.4156 24.4211 16.1831 22.8113 15.337 20.9938C14.491 19.1763 14.0517 17.1951 14.0502 15.1894Z"
          fill="#4D484F"
        />
        <path
          d="M28.4236 1.21321C25.0408 1.20793 21.7606 2.38005 19.14 4.53046L27.8271 13.27C28.0518 13.4947 28.23 13.7618 28.3517 14.0559C28.4733 14.3501 28.5359 14.6655 28.5359 14.984C28.5359 15.3026 28.4733 15.618 28.3517 15.9121C28.23 16.2063 28.0518 16.4734 27.8271 16.6981L18.9001 25.6722C21.5603 27.9383 24.9368 29.1768 28.4236 29.1654C36.3716 29.1654 42.8221 22.9155 42.8221 15.1991C42.8221 7.48275 36.3587 1.21321 28.4236 1.21321Z"
          fill="#4D484F"
        />
      </svg>
    );
  },
};
