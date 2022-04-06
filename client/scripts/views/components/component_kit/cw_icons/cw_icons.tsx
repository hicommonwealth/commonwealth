/* @jsx m */

/* eslint-disable max-len */

import m from 'mithril';

import 'components/component_kit/cw_icon.scss';

import { IconAttrs } from './cw_icon';
import { getIconClasses } from '../helpers';

export const CWArrowLeft: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path fill="#fff" d="M0 0H32V32H0z"></path>
        <path
          fill="#4D484F"
          fill-rule="evenodd"
          d="M29.64 7.316a.5.5 0 01.004.71L11.896 25.862a1.487 1.487 0 01-2.105 0L2.356 18.39a.5.5 0 01.005-.71l.688-.672a.5.5 0 01.703.005l6.737 6.77a.5.5 0 00.709 0l17.05-17.134a.5.5 0 01.703-.005l.688.672z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWChevronDown: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path d="M17.333 21.61c0 .343-.335.621-.75.621h-.5c-.414 0-.75-.278-.75-.622v-7.05c0-.344.336-.623.75-.623h.5c.415 0 .75.279.75.622v7.051zM15 11.102a1.334 1.334 0 112.667 0 1.334 1.334 0 01-2.667 0z"></path>
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
        onclick={onclick}
      >
        <path
          fill-rule="evenodd"
          d="M30 16c0 7.732-6.268 14-14 14S2 23.732 2 16 8.268 2 16 2s14 6.268 14 14zm-15-4.898a1.334 1.334 0 112.667 0 1.334 1.334 0 01-2.667 0zm1.583 11.13c.414 0 .75-.28.75-.623v-7.05c0-.344-.336-.623-.75-.623h-.5c-.415 0-.75.279-.75.622v7.051c0 .344.335.622.75.622h.5z"
          clip-rule="evenodd"
        ></path>
      </svg>
    );
  },
};

export const CWJar: m.Component<IconAttrs> = {
  view: (vnode) => {
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
    const { className, disabled, iconSize, onclick } = vnode.attrs;
    return (
      <svg
        class={getIconClasses({ disabled, iconSize, className })}
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
