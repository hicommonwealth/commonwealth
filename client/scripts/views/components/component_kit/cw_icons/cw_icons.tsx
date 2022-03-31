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

export const CWProfile: m.Component<IconAttrs> = {
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
        <path d="M6.454 5.747c.195-.195.6-.107.904.196l18.699 18.7c.303.303.391.708.196.903l-.707.707c-.195.195-.6.107-.904-.196L5.943 7.357c-.303-.303-.391-.708-.196-.903l.707-.707z"></path>
        <path d="M26.253 6.454c.195.195.107.6-.196.904l-18.7 18.699c-.303.303-.708.391-.903.196l-.707-.707c-.195-.195-.107-.6.196-.904l18.7-18.699c.303-.303.708-.391.903-.196l.707.707z"></path>
      </svg>
    );
  },
};
