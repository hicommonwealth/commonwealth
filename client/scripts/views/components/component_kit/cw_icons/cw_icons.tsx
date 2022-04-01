/* @jsx m */

/* eslint-disable max-len */

import m from 'mithril';

import 'components/component_kit/cw_icon.scss';

import { IconAttrs } from './cw_icon';
import { getIconClasses } from '../helpers';

export const CWAdd: m.Component<IconAttrs> = {
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
        <mask
          id="path-1-outside-1_402_11947"
          width="25"
          height="27"
          x="4"
          y="3.5"
          maskUnits="userSpaceOnUse"
        >
          {/* Gabe 3/31/22 - icon will not render without this fill */}
          <path fill="#fff" d="M4 3.5H29V30.5H4z"></path>
          <path
            fill-rule="evenodd"
            d="M15.195 18.207v6.123l2.61 3.17v-9.295L27 5.5H6l9.195 12.707z"
            clip-rule="evenodd"
          ></path>
        </mask>
        <path
          d="M15.195 24.33h-2a2 2 0 00.457 1.272l1.543-1.272zm0-6.123h2a2 2 0 00-.38-1.173l-1.62 1.173zm2.61 9.293l-1.543 1.271a2 2 0 003.544-1.27h-2zm0-9.295l-1.62-1.172a2 2 0 00-.38 1.172h2zM27 5.5l1.62 1.173A2 2 0 0027 3.5v2zm-21 0v-2a2 2 0 00-1.62 3.173L6 5.5zm11.195 18.83v-6.123h-4v6.123h4zm2.155 1.899l-2.61-3.17-3.088 2.543 2.61 3.17 3.088-2.543zm-3.544-8.024V27.5h4v-9.295h-4zm3.62 1.173L28.62 6.673l-3.24-2.346-9.194 12.706 3.24 2.345zM27 3.5H6v4h21v-4zM4.38 6.673l9.195 12.706 3.24-2.345L7.62 4.327 4.38 6.673z"
          mask="url(#path-1-outside-1_402_11947)"
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

export const CWPencil: m.Component<IconAttrs> = {
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

export const CWThumbs: m.Component<IconAttrs> = {
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

export const CWX: m.Component<IconAttrs> = {
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
        <g fill="#342E37" clip-path="url(#clip0_402_12158)">
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
