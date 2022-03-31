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
          fillRule="evenodd"
          d="M16 5.957c-5.191 0-9.4 4.179-9.4 9.333v6.417a.585.585 0 01-.587.583H4.838a.585.585 0 00-.588.584v1.166c0 .322.263.584.588.584h22.325a.585.585 0 00.587-.584v-1.166a.585.585 0 00-.587-.584h-1.175a.585.585 0 01-.588-.583V15.29c0-5.154-4.208-9.333-9.4-9.333z"
          clipRule="evenodd"
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
        <path d="M15.333 10.25a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.502a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V10.25zM17.667 22.336a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
        <path d="M15.333 10.25a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.502a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V10.25zM17.667 22.336a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
        <path
          fillRule="evenodd"
          d="M16 28.5c6.627 0 12-5.373 12-12s-5.373-12-12-12-12 5.373-12 12 5.373 12 12 12zm0 2c7.732 0 14-6.268 14-14s-6.268-14-14-14-14 6.268-14 14 6.268 14 14 14z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M15.67 6.81L3.982 27.077h23.376L15.67 6.81zm.766-2.867a.884.884 0 00-1.532 0L1.12 27.845a.885.885 0 00.766 1.328h27.568a.885.885 0 00.766-1.328L16.436 3.943z"
          clipRule="evenodd"
        ></path>
        <rect width="2" height="10.002" x="14.67" y="11.335" rx="0.75"></rect>
        <circle cx="15.67" cy="24.172" r="1.334"></circle>
        <rect width="2" height="10.002" x="14.67" y="11.335" rx="0.75"></rect>
        <circle cx="15.67" cy="24.172" r="1.334"></circle>
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
        <rect
          width="19.951"
          height="23.926"
          x="5.989"
          y="6.366"
          stroke="#342E37"
          strokeWidth="2"
          rx="8"
        ></rect>
        <rect
          width="15.96"
          height="10.444"
          x="7.984"
          y="19.847"
          stroke="#342E37"
          strokeWidth="2"
          rx="5.222"
        ></rect>
        <ellipse
          cx="9.479"
          cy="17.291"
          fill="#342E37"
          rx="1.497"
          ry="1.556"
        ></ellipse>
        <ellipse
          cx="22.45"
          cy="17.291"
          fill="#342E37"
          rx="1.497"
          ry="1.556"
        ></ellipse>
        <ellipse
          cx="11.973"
          cy="25.069"
          fill="#342E37"
          rx="0.998"
          ry="1.037"
        ></ellipse>
        <ellipse
          cx="19.956"
          cy="25.069"
          fill="#342E37"
          rx="0.998"
          ry="1.037"
        ></ellipse>
        <ellipse
          cx="13.969"
          cy="10.551"
          fill="#342E37"
          rx="4.989"
          ry="5.185"
        ></ellipse>
        <path
          stroke="#342E37"
          strokeWidth="2"
          d="M26.836 3.652a.477.477 0 01.693 0l.395.41c1.15 1.195 1.15 3.13 0 4.325l-1.806 1.877a.477.477 0 01-.694 0l-2.128-2.212a.524.524 0 010-.721l3.54-3.68z"
        ></path>
        <path
          fill="#342E37"
          d="M25.65 10.677a2.914 2.914 0 014.233 0l1.411 1.466c.39.405.39 1.062 0 1.467a2.914 2.914 0 01-4.233 0l-1.41-1.467a1.066 1.066 0 010-1.466z"
        ></path>
        <path
          stroke="#342E37"
          strokeWidth="2"
          d="M5.164 3.652a.477.477 0 00-.693 0l-.395.41c-1.15 1.195-1.15 3.13 0 4.325l1.806 1.877a.477.477 0 00.694 0l2.128-2.212a.524.524 0 000-.721l-3.54-3.68z"
        ></path>
        <path
          fill="#342E37"
          d="M6.35 10.677a2.914 2.914 0 00-4.233 0L.706 12.143a1.066 1.066 0 000 1.467 2.914 2.914 0 004.233 0l1.41-1.467c.39-.405.39-1.061 0-1.466z"
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
          fillRule="evenodd"
          d="M12.08 4.18c0-.928.753-1.68 1.68-1.68 6.186 0 11.2 5.014 11.2 11.2a1.68 1.68 0 01-3.36 0 7.84 7.84 0 00-7.84-7.84 1.68 1.68 0 01-1.68-1.68zM19.92 28.82a1.68 1.68 0 01-1.68 1.68c-6.186 0-11.2-5.014-11.2-11.2a1.68 1.68 0 013.36 0 7.84 7.84 0 007.84 7.84c.927 0 1.68.752 1.68 1.68zM3.68 20.42A1.68 1.68 0 012 18.74c0-6.186 5.014-11.2 11.2-11.2a1.68 1.68 0 010 3.36 7.84 7.84 0 00-7.84 7.84 1.68 1.68 0 01-1.68 1.68zM28.32 12.58c.928 0 1.68.752 1.68 1.68 0 6.185-5.014 11.2-11.2 11.2a1.68 1.68 0 110-3.36 7.84 7.84 0 007.84-7.84c0-.928.752-1.68 1.68-1.68z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M5 4.5a1 1 0 00-1 1v22a1 1 0 001 1h22a1 1 0 001-1v-6.357a1 1 0 112 0V27.5a3 3 0 01-3 3H5a3 3 0 01-3-3v-22a3 3 0 013-3h6.357a1 1 0 110 2H5zm10-1a1 1 0 011-1h13a1 1 0 011 1v13a1 1 0 11-2 0V5.914L16.707 17.207a1 1 0 01-1.414-1.414L26.586 4.5H16a1 1 0 01-1-1z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M2 6.187c0-.38.313-.687.699-.687H29.3c.386 0 .699.308.699.687v20.625c0 .605-.74.915-1.183.495l-4.028-3.808H2.7A.693.693 0 012 22.812V6.187zM8 16.5a2 2 0 100-4 2 2 0 000 4zm10-2a2 2 0 11-4 0 2 2 0 014 0zm6 2a2 2 0 100-4 2 2 0 000 4z"
          clipRule="evenodd"
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
            fillRule="evenodd"
            d="M15.195 18.207v6.123l2.61 3.17v-9.295L27 5.5H6l9.195 12.707z"
            clipRule="evenodd"
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
          fillRule="evenodd"
          d="M28 3.278c0-.43-.384-.778-.857-.778H4.857c-.473 0-.857.348-.857.778V29.72c0 .706.953 1.046 1.484.53l9.89-9.624a.918.918 0 011.253 0l9.889 9.624c.53.516 1.484.176 1.484-.53V3.277z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M16 26.5c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm0-6a4 4 0 100-8 4 4 0 000 8z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M16.067 2.5a13.878 13.878 0 00-9.115 3.417 14.431 14.431 0 00-4.77 8.639 14.61 14.61 0 001.852 9.735 14.11 14.11 0 007.59 6.185c.7.132.958-.308.958-.696v-2.44c-3.925.872-4.753-1.93-4.753-1.93a3.79 3.79 0 00-1.562-2.098c-1.277-.88.095-.88.095-.88.446.062.873.227 1.247.484.373.256.685.597.91.996.19.353.448.665.757.916a2.935 2.935 0 003.332.273 3.096 3.096 0 01.862-1.92c-3.088-.344-6.366-1.578-6.366-7.076a5.618 5.618 0 011.45-3.85 5.266 5.266 0 01.137-3.799s1.182-.387 3.865 1.472a13.05 13.05 0 017.04 0c2.682-1.86 3.864-1.472 3.864-1.472a5.257 5.257 0 01.12 3.798 5.61 5.61 0 011.442 3.85c0 5.517-3.287 6.724-6.419 7.05.334.346.592.76.757 1.216.166.456.234.942.2 1.427v3.939c0 .476.251.828.967.687a14.118 14.118 0 007.484-6.208 14.612 14.612 0 001.806-9.673 14.433 14.433 0 00-4.723-8.585A13.882 13.882 0 0016.068 2.5z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M17.204 27.821a2.121 2.121 0 01-2.462.003c-1.655-1.177-4.483-3.34-6.921-5.852-1.219-1.255-2.39-2.649-3.269-4.095C3.688 16.454 3 14.804 3 13.08 3 8.92 6.315 5.5 10.528 5.5c2.002 0 3.714.804 4.863 1.524.207.13.402.26.583.39.181-.13.376-.26.584-.39 1.148-.72 2.86-1.524 4.862-1.524A7.58 7.58 0 0129 13.08c0 1.732-.703 3.389-1.577 4.812-.89 1.45-2.076 2.846-3.306 4.102-2.46 2.514-5.3 4.676-6.913 5.827zM16.093 10.05c.544-.52 2.723-2.428 5.327-2.428a5.459 5.459 0 015.459 5.459c0 4.702-7.772 10.775-10.908 13.016-3.21-2.283-10.85-8.314-10.85-13.016 0-3.015 2.392-5.459 5.407-5.459 2.604 0 4.783 1.909 5.327 2.428.06.057.1.098.12.117.018-.02.058-.06.118-.117z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M14.742 27.824a2.121 2.121 0 002.462-.003c1.612-1.151 4.453-3.313 6.913-5.827 1.23-1.256 2.415-2.653 3.306-4.102C28.297 16.47 29 14.812 29 13.08a7.58 7.58 0 00-7.58-7.58c-2.002 0-3.714.804-4.863 1.524-.207.13-.402.26-.583.39a12.42 12.42 0 00-.583-.39c-1.149-.72-2.86-1.524-4.863-1.524C6.315 5.5 3 8.92 3 13.08c0 1.724.688 3.374 1.552 4.797.878 1.447 2.05 2.84 3.269 4.095 2.438 2.511 5.266 4.675 6.921 5.852z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M11.901 3.5a1 1 0 011-1h15.52a1 1 0 011 1v26a1 1 0 01-1 1h-15.52a1 1 0 110-2h14.52v-24h-14.52a1 1 0 01-1-1zM4.536 17.417a1.2 1.2 0 010-1.834l.645.764.003.004m1.366.149l4.627-3.905a1 1 0 00-1.29-1.529l-5.35 4.517.644.764m1.37.153l4.626 3.905a1 1 0 11-1.29 1.528l-5.35-4.516"
          clipRule="evenodd"
        ></path>
        <path
          fillRule="evenodd"
          d="M21.662 16.5a1 1 0 01-1 1H4.999a1 1 0 110-2h15.663a1 1 0 011 1z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M5.946 28.017a.5.5 0 01-.607-.567l.195-1.19.034-.206v-.002l.964-5.87-.002-.003 1.365-1.461L18.82 7.028l2.048-2.193a2 2 0 012.827-.095l3.654 3.413a2 2 0 01.095 2.827l-2.048 2.192-10.923 11.689-1.357 1.453-.008.008.013.012-.031.008-2.31.542-3.453.81h-.003l-.203.048-1.174.275zm5.927-3.445l-3.685.865-.422-.428.642-3.911.064-.069 3.401 3.543zm8.427-16.2l3.71 3.352 1.972-2.11-3.653-3.413L20.3 8.37z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M26.622 12.56a3.998 3.998 0 01-2.443 3.684 6.501 6.501 0 014.93 5.81c.02.275-.205.5-.481.5h-6.29a7.014 7.014 0 00-3.962-4.436 4.522 4.522 0 001.111-1.253 6.46 6.46 0 011.586-.62 3.998 3.998 0 01-1.067-.665 4.508 4.508 0 00-1.201-4.2 3.999 3.999 0 017.817 1.18zm-7.951-.588a3.981 3.981 0 01.908 3.177 3.981 3.981 0 01-.908-3.177zm-1.023 6.406a6.464 6.464 0 00-1.501 3.675c-.021.276.205.5.48.5h5.187a6.515 6.515 0 00-4.166-4.175zM11.244 15.58a4 4 0 01-1.065.664 6.457 6.457 0 011.58.616c.29.487.67.914 1.117 1.26a7.015 7.015 0 00-3.958 4.433h-6.29a.472.472 0 01-.481-.5 6.501 6.501 0 014.926-5.808 3.998 3.998 0 115.372-4.865 4.508 4.508 0 00-1.201 4.2zm2.363 2.798a6.515 6.515 0 00-4.165 4.175h5.186a.472.472 0 00.48-.5 6.464 6.464 0 00-1.501-3.675zm-1.028-6.406a3.981 3.981 0 01-.908 3.177 3.981 3.981 0 01.908-3.177z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M19.114 17.873A8.002 8.002 0 0016.004 2.5a8 8 0 00-3.107 15.374C7.37 19.23 3.233 24.114 3.01 30c-.01.276.214.501.49.501h25.018a.486.486 0 00.49-.5c-.222-5.889-4.364-10.774-9.894-12.127z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M25.605 15.366c0 5.93-4.808 10.737-10.738 10.737S4.13 21.296 4.13 15.366 8.937 4.628 14.867 4.628s10.738 4.808 10.738 10.738zm-2.548 9.756a12.686 12.686 0 01-8.19 2.981C7.832 28.103 2.13 22.4 2.13 15.366c0-7.035 5.702-12.738 12.737-12.738s12.738 5.703 12.738 12.738c0 3.118-1.121 5.975-2.982 8.19l5.47 5.469c.096.096-.002.35-.218.565l-.783.784c-.216.216-.47.313-.566.217l-5.47-5.47z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M27.432 17.105a.712.712 0 000-1.21L5.24 2.595c-.449-.27-1.01.067-1.01.604v11.103l13.804 1.504c.803.087.803 1.3 0 1.388L4.232 18.7V29.8c0 .537.56.873 1.009.604l22.19-13.3z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M29.764 10.918a.482.482 0 000-.836L16.727 2.565a.483.483 0 00-.724.418v6.55a13.26 13.26 0 00-7.641 3.066c-3.565 2.989-6.26 8.376-6.356 17.398a.498.498 0 00.497.503h1c.277 0 .5-.227.503-.503.096-8.624 2.66-13.366 5.641-15.865a11.275 11.275 0 016.356-2.595v6.48c0 .371.402.603.724.418l13.037-7.517z"
          clipRule="evenodd"
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
          fillRule="evenodd"
          d="M25.232 28.084l4.752-22.857a.76.76 0 00-1.019-.864L2.487 14.578c-.653.251-.648 1.177.008 1.422l6.451 2.408 2.498 8.031a.76.76 0 001.206.363l3.596-2.931a1.072 1.072 0 011.308-.037l6.487 4.71a.76.76 0 001.19-.46zm-14.19-10.958L23.65 9.36c.227-.139.46.168.265.348L13.51 19.381c-.366.34-.601.796-.668 1.29l-.355 2.628c-.047.35-.54.385-.636.046l-1.364-4.79a1.27 1.27 0 01.555-1.429z"
          clipRule="evenodd"
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
        <circle cx="16" cy="16.5" r="6"></circle>
        <path
          fillRule="evenodd"
          d="M24.907 20.42C27.144 19.142 28 17.682 28 16.5s-.856-2.642-3.093-3.92c-2.18-1.246-5.325-2.08-8.907-2.08s-6.727.834-8.907 2.08C4.856 13.858 4 15.318 4 16.5s.856 2.642 3.093 3.92c2.18 1.246 5.325 2.08 8.907 2.08s6.727-.834 8.907-2.08zM16 24.5c7.732 0 14-3.582 14-8s-6.268-8-14-8-14 3.582-14 8 6.268 8 14 8z"
          clipRule="evenodd"
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
        <circle cx="15" cy="15" r="14" stroke-width="1.5"></circle>
        <ellipse cx="15" cy="15" stroke-width="1.5" rx="9" ry="14"></ellipse>
        <ellipse cx="15" cy="15" stroke-width="1.5" rx="3" ry="14"></ellipse>
        <path strokeW-width="1.5" d="M1 15h28M3 8h24M3 22h24"></path>
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
        <g fill="#342E37" clipPath="url(#clip0_402_12158)">
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
