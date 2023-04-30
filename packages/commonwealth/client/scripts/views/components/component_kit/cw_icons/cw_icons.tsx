/* eslint-disable max-len */
import React from 'react';

// import 'components/component_kit/cw_icon.scss';
import '../../../../../styles/components/component_kit/cw_icon.scss';
// import 'components/component_kit/cw_icon_button.scss';
import '../../../../../styles/components/component_kit/cw_icon_button.scss';

import { getClasses } from '../helpers';
import type { IconProps, IconStyleProps } from './types';

// ADDING ICONS: INSTRUCTIONS
//
// (1) New icon components should be added to this page alphabetically.
// (2) All icons should extend the boilerplate/template provided below.
// (3) You may want to use an SVG to JSX converter such as https://svg2jsx.com/
// (4) Ensure that path and svg tag property casings conform with Mozilla docs
//     For instance:
//       - "fillRule" over "fill-rule"
//       - "clipRule" over "clip-rule"
//       - "viewBox" over "view-box"
// (5) Remove all "fill" properties from path tags, to allow SCSS coloration
// (6) Icons must be added to the cw_icon_lookup.ts registry
//
// If added properly, the icon should auto-display in the component kit.

// ICON TEMPLATE
// export const CWIconName = (props: IconAttrs) => {
// const {
//   className,
//   componentType,
//   disabled,
//   iconButtonTheme,
//   iconSize,
//   selected,
//   ...otherProps
// } = props;

// return (
//   <svg
//     className={getClasses<IconStyleAttrs>(
//       { className, disabled, iconButtonTheme, iconSize, selected },
//       componentType
//     )}
//     xmlns="http://www.w3.org/2000/svg"
//     width="32"
//     height="32"
//     fill="none"
//     viewBox="0 0 32 32"
//     {...otherProps}
//       {/* INSERT PATH HERE */}
//       </svg>
//     );
//   }
// }

export const CWArrowLeft = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;

  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M2.244 15.582a.482.482 0 000 .836l13.038 7.517a.483.483 0 00.724-.418V17h13.5a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-13.5V8.483a.483.483 0 00-.724-.418L2.244 15.582z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWArrowRight = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M29.764 16.418a.482.482 0 000-.836L16.727 8.065a.483.483 0 00-.724.418V15h-13.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h13.5v6.517c0 .371.402.603.724.418l13.037-7.517z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWBacker = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.24231 29.0732C4.13774 29.0732 3.24231 28.1778 3.24231 27.0732V21.0732C3.24231 19.9687 4.13774 19.0732 5.24231 19.0732H6.71179C7.62855 19.0732 8.40125 19.6901 8.6375 20.5313C9.89229 20.4796 12.4946 20.4574 13.1416 20.7742C13.7947 21.0939 15.4045 22.1522 16.1278 22.6414C17.7208 22.9126 20.9834 23.5367 21.29 23.8632C21.3888 23.9685 21.5429 24.1607 21.6853 24.3894L21.709 24.3804C21.6955 24.4366 21.6877 24.4946 21.6857 24.5525C21.6774 24.7993 21.5966 24.9668 21.5082 25.082C21.4348 25.1778 21.3439 25.253 21.2517 25.3093C21.097 25.4037 20.9107 25.4192 20.7295 25.4192H15.849C15.6745 25.4192 15.5013 25.3883 15.3375 25.3279L14.4184 24.9893C14.1593 24.8938 13.8718 25.0265 13.7764 25.2856C13.6809 25.5447 13.8136 25.8322 14.0727 25.9276L15.1339 26.3186C15.3144 26.3851 15.5053 26.4192 15.6977 26.4192H21.0621C21.097 26.4192 21.1318 26.4155 21.1659 26.4083C21.5059 26.3362 21.9715 26.1211 22.3017 25.6906C22.5759 25.3332 22.7286 24.8635 22.6758 24.2889C22.6675 24.1985 22.6316 24.1208 22.5776 24.0597C23.9704 23.5577 25.5058 23.0651 26.7328 22.8141C29.0817 22.3337 28.9127 23.6816 28.5345 24.4156L19.4593 29.02H12.8531L8.71179 26.4564V27.0732C8.71179 28.1778 7.81636 29.0732 6.71179 29.0732H5.24231ZM8.65835 20.612H8.67324L8.65277 20.589C8.65467 20.5967 8.65653 20.6043 8.65835 20.612ZM5.24231 27.0732H6.71179L6.71179 21.0732H5.24231V27.0732Z"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.7854 20.6798C17.2864 21.0361 17.9583 21.0354 18.4586 20.678C19.5539 19.8954 21.4843 18.4266 23.1562 16.718C23.9916 15.8642 24.7976 14.9153 25.4026 13.9305C25.9969 12.9632 26.4744 11.8375 26.4744 10.66C26.4744 7.81536 24.1683 5.50928 21.3236 5.50928C19.9626 5.50928 18.7992 6.05585 18.019 6.54485C17.878 6.63321 17.7455 6.72219 17.6224 6.80941C17.4994 6.72219 17.3669 6.63321 17.2259 6.54485C16.4457 6.05585 15.2823 5.50928 13.9213 5.50928C11.0587 5.50928 8.80579 7.83338 8.80579 10.66C8.80579 11.8319 9.27339 12.9531 9.86044 13.92C10.4574 14.9032 11.2536 15.8501 12.0816 16.7031C13.7384 18.4097 15.6604 19.8798 16.7854 20.6798Z"
      ></path>
    </svg>
  );
};

export const CWBadge = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M15.56 5.391a.5.5 0 01.88 0l2.75 5.06a.5.5 0 00.453.262l5.758-.148a.5.5 0 01.439.761l-3.007 4.913a.5.5 0 000 .522l3.007 4.913a.5.5 0 01-.44.76l-5.757-.147a.5.5 0 00-.453.261l-2.75 5.06a.5.5 0 01-.88 0l-2.75-5.06a.5.5 0 00-.453-.26l-5.758.147a.5.5 0 01-.439-.761l3.007-4.913a.5.5 0 000-.522L6.16 11.326a.5.5 0 01.44-.76l5.757.147a.5.5 0 00.453-.261l2.75-5.06z"></path>
      <path d="M17.083 4.583a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0zM17.083 28.417a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0zM27.183 22.458a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0zM6.882 22.458a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0zM6.882 10.64a1.083 1.083 0 11-2.167 0 1.083 1.083 0 012.167 0zM27.183 10.64a1.083 1.083 0 11-2.166 0 1.083 1.083 0 012.166 0z"></path>
    </svg>
  );
};

export const CWBell = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M19.456 27.043a3.456 3.456 0 11-6.913.001 3.456 3.456 0 016.913 0zM18.42 4.747a2.247 2.247 0 11-4.494 0 2.247 2.247 0 014.493 0z"></path>
      <path
        fillRule="evenodd"
        d="M16 5.957c-5.191 0-9.4 4.179-9.4 9.333v6.417a.585.585 0 01-.587.583H4.838a.585.585 0 00-.588.584v1.166c0 .322.263.584.588.584h22.325a.585.585 0 00.587-.584v-1.166a.585.585 0 00-.587-.584h-1.175a.585.585 0 01-.588-.583V15.29c0-5.154-4.208-9.333-9.4-9.333z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWCautionCircle = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M15.333 9.75a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.502a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V9.75zM17.667 21.836a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
      <path d="M15.333 9.75a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.502a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V9.75zM17.667 21.836a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
      <path
        fillRule="evenodd"
        d="M16 28c6.627 0 12-5.373 12-12S22.627 4 16 4 4 9.373 4 16s5.373 12 12 12zm0 2c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16s6.268 14 14 14z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWCautionTriangle = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M15.67 6.31L3.982 26.577h23.376L15.67 6.31zm.766-2.867a.884.884 0 00-1.532 0L1.12 27.345a.885.885 0 00.766 1.328h27.568a.885.885 0 00.766-1.328L16.436 3.443z"
        clipRule="evenodd"
      ></path>
      <path d="M14.67 11.585a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.503a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-8.503zM17.003 23.672a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
      <path d="M14.67 11.585a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v8.503a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-8.503zM17.003 23.672a1.334 1.334 0 11-2.667 0 1.334 1.334 0 012.667 0z"></path>
    </svg>
  );
};

export const CWCheck = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M27.62 6.416a1 1 0 01.165 1.405L12.426 27.25l-8.09-7.18a1 1 0 111.328-1.496l6.506 5.774L26.215 6.58a1 1 0 011.405-.164z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWCheckCircle = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="33"
      height="33"
      fill="none"
      viewBox="0 0 33 33"
      {...otherProps}
    >
      <polygon
        points="10.0246914 12.9878307 7.8521164 15.0126102 14.8644621 22.5681658 31.0126102 6.42001764 28.9385362 4.34594356 14.9632275
 18.3212522"
      ></polygon>
      <path
        d="M29.037037,16.0001764 C29.037037,23.2102293 23.2100529,29.0372134 16,29.0372134 C8.78994709,29.0372134 2.96296296,23.2102293 2.
96296296,16.0001764 C2.96296296,8.79012346 8.78994709,2.96313933 16,2.96313933 L16,0 C7.16049383,0 0,7.16040564 0,16 C0,24.8395062 7.16075838,32
16,32 C24.8392416,32 32,24.8392416 32,16 L29.037037,16.0001764 Z"
      ></path>
    </svg>
  );
};

export const CWChevronDown = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M25.153 11.117a1 1 0 01.105 1.41l-8.614 10a1 1 0 01-1.515 0l-8.387-9.736a1 1 0 011.516-1.306l7.629 8.858 7.855-9.12a1 1 0 011.41-.106z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWChevronLeft = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M21.758 7.472a1 1 0 00-1.41-.105l-10 8.614a1 1 0 000 1.515l9.736 8.387a1 1 0 101.305-1.516l-8.857-7.629 9.12-7.855a1 1 0 00.106-1.41z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWChevronRight = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M10.242 7.597a1 1 0 011.41-.105l10 8.614a1 1 0 010 1.515l-9.736 8.387a1 1 0 11-1.305-1.516l8.857-7.629-9.12-7.855a1 1 0 01-.106-1.41z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWChevronUp = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M6.847 21.758a1 1 0 01-.105-1.41l8.614-10a1 1 0 011.515 0l8.387 9.736a1 1 0 01-1.516 1.306l-7.629-8.858-7.855 9.12a1 1 0 01-1.41.106z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWClock = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 30.5C23.732 30.5 30 24.232 30 16.5C30 8.76801 23.732 2.5 16 2.5C8.26801 2.5 2 8.76801 2 16.5C2 24.232 8.26801 30.5 16 30.5ZM14.9988 16.6346C14.9988 17.0679 15.254 17.4297 15.5939 17.5152C15.7083 17.5592 15.8358 17.5837 15.9701 17.5837H26.1705C26.6675 17.5837 27.0703 17.248 27.0703 16.8339V16.3336C27.0703 15.9194 26.6675 15.5837 26.1705 15.5837H16.9988V6.43422C16.9988 5.93728 16.6631 5.53442 16.2489 5.53442H15.7486C15.3345 5.53442 14.9988 5.93728 14.9988 6.43422V16.6346Z"
      ></path>
    </svg>
  );
};

export const CWClose = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <g clipPath="url(#clip0_402_12158)">
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
};

export const CWCloud = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <circle cx="16.069" cy="9.273" r="7.273"></circle>
      <circle cx="16.069" cy="9.273" r="7.273"></circle>
      <circle cx="23.904" cy="11.698" r="4.849"></circle>
      <circle cx="8.096" cy="11.698" r="4.849"></circle>
      <path
        fillRule="evenodd"
        d="M6.916 17.725l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM23.858 17.725l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM6.916 26.306l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM11.789 21.433l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM23.858 26.306l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM16.024 17.725l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM16.024 26.306l-.925 1.97a1.135 1.135 0 101.939 0h.001l-.925-1.97a.05.05 0 00-.09 0zM20.26 21.433l-.926 1.97h.001a1.135 1.135 0 101.939 0l-.924-1.97a.05.05 0 00-.09 0z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWCollapse = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M17 29a1 1 0 01-1 1H3a1 1 0 01-1-1V16a1 1 0 112 0v10.586l11.293-11.293a1 1 0 011.414 1.414L5.414 28H16a1 1 0 011 1z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWCommonLogo = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path d="M11.0929 16.1265C11.0999 14.7619 11.4109 13.416 12.0029 12.1872C12.5951 10.9584 13.4533 9.87773 14.5152 9.02407L12.4159 6.919C12.1133 6.6157 11.7029 6.44531 11.2751 6.44531C10.8473 6.44531 10.4369 6.6157 10.1343 6.919L2.21849 14.8565C1.91601 15.1599 1.74609 15.5714 1.74609 16.0004C1.74609 16.4294 1.91601 16.8409 2.21849 17.1443L10.1343 25.0818C10.4369 25.3851 10.8473 25.5555 11.2751 25.5555C11.7029 25.5555 12.1133 25.3851 12.4159 25.0818L14.3547 23.1333C13.3342 22.2747 12.5134 21.2026 11.9499 19.9922C11.3865 18.7817 11.0939 17.4623 11.0929 16.1265Z" />
      <path d="M20.6647 6.81642C18.4119 6.81295 16.2273 7.59355 14.482 9.02568L20.2675 14.8461C20.4171 14.9957 20.5358 15.1736 20.6168 15.3695C20.6978 15.5654 20.7395 15.7754 20.7395 15.9876C20.7395 16.1998 20.6978 16.4098 20.6168 16.6057C20.5358 16.8016 20.4171 16.9795 20.2675 17.1291L14.3223 23.1058C16.0939 24.6149 18.3426 25.4398 20.6647 25.4322C25.958 25.4322 30.2539 21.2697 30.2539 16.1308C30.2539 10.9918 25.9493 6.81642 20.6647 6.81642Z" />
    </svg>
  );
};

export const CWCompass = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M16 18.428c1.657 0 3-1.303 3-2.91 0-1.606-1.343-2.909-3-2.909s-3 1.303-3 2.91c0 1.606 1.343 2.909 3 2.909z"></path>
      <path
        fillRule="evenodd"
        d="M30 15.52c0 7.497-6.268 13.575-14 13.575S2 23.017 2 15.519 8.268 1.943 16 1.943 30 8.021 30 15.52zM16.21 6.63c-.092-.208-.32-.208-.411 0l-2.674 6.094-6.292 2.596c-.215.088-.215.31 0 .398l6.291 2.596 2.674 6.096c.092.208.32.208.41 0l2.677-6.1 6.283-2.591c.215-.09.215-.31 0-.399l-6.283-2.592L16.21 6.63zm2.875 5.378l-.263-.813a.191.191 0 01.091-.226l2.834-1.57c.184-.103.384.106.265.277l-1.813 2.59a.203.203 0 01-.22.077l-.758-.207a.197.197 0 01-.136-.128zm-5.898-.813l-.263.813a.197.197 0 01-.137.128l-.758.207a.203.203 0 01-.22-.078l-1.812-2.59c-.12-.17.08-.379.265-.277l2.833 1.57c.082.046.12.14.092.227zm6.148 7.58l-.263.812a.191.191 0 00.091.227l2.834 1.57c.184.102.384-.107.265-.277l-1.813-2.59a.203.203 0 00-.22-.078l-.758.207a.197.197 0 00-.136.128zm-6.336.812l-.263-.812a.197.197 0 00-.137-.13l-.758-.206a.203.203 0 00-.22.078l-1.812 2.59c-.119.17.081.379.265.277l2.834-1.57a.191.191 0 00.091-.227z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWCopy = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M16.5 11.5a.5.5 0 01.5.5v15a.5.5 0 01-.5.5h-11A.5.5 0 015 27V12a.5.5 0 01.5-.5h11zm2-2a.5.5 0 01.5.5v19a.5.5 0 01-.5.5h-15A.5.5 0 013 29V10a.5.5 0 01.5-.5h15z"
        clipRule="evenodd"
      ></path>
      <path d="M26 6a.5.5 0 00-.5-.5h-11a.5.5 0 00-.5.5v3.5h-2V4a.5.5 0 01.5-.5h15a.5.5 0 01.5.5v19a.5.5 0 01-.5.5H19v-2h6.5a.5.5 0 00.5-.5V6z"></path>
    </svg>
  );
};

export const CWCouncilProposal = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M14.586 8.914a2 2 0 012.828 0l6.364 6.364a2 2 0 010 2.829l-6.364 6.364a2 2 0 01-2.828 0l-6.364-6.364a2 2 0 010-2.829l6.364-6.364zM11 8.5a3 3 0 11-6 0 3 3 0 016 0zM27 8.5a3 3 0 11-6 0 3 3 0 016 0zM11 24.5a3 3 0 11-6 0 3 3 0 016 0zM27 24.5a3 3 0 11-6 0 3 3 0 016 0z"></path>
    </svg>
  );
};

export const CWCow = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M5.857 2.431a1.432 1.432 0 00-2.08 0l-.395.411c-1.532 1.592-1.532 4.173 0 5.765l.64.666a2.933 2.933 0 00-1.906.904l-1.41 1.466a1.066 1.066 0 000 1.467 2.914 2.914 0 004.233 0l.09-.094c-.027.28-.04.563-.04.85v7.925a8.998 8.998 0 004.68 7.898 6.194 6.194 0 003.537 1.102h5.516c1.313 0 2.53-.406 3.534-1.1a8.998 8.998 0 004.684-7.9v-7.925a9.11 9.11 0 00-.047-.93l.168.174a2.914 2.914 0 004.233 0c.39-.405.39-1.062 0-1.467l-1.411-1.466a2.933 2.933 0 00-1.906-.904l.64-.666c1.532-1.592 1.532-4.173 0-5.765l-.395-.41a1.432 1.432 0 00-2.08 0l-3.54 3.678a1.642 1.642 0 00-.033.036 8.959 8.959 0 00-4.629-1.28h-4.025a8.957 8.957 0 00-4.51 1.253l-.008-.009-3.54-3.679zm-1.04 1.802L7.664 7.19 6.228 8.683l-1.46-1.517a2.095 2.095 0 010-2.883l.049-.05zm22.365 0L24.336 7.19l1.435 1.492 1.46-1.517a2.095 2.095 0 000-2.883l-.049-.05zM9.117 8.839c-.09.389-.137.795-.137 1.212 0 2.864 2.234 5.185 4.989 5.185s4.989-2.322 4.989-5.185c0-1.201-.393-2.306-1.052-3.185h.034a7 7 0 017 7v7.925c0 .487-.05.963-.144 1.422a6.225 6.225 0 00-6.074-4.866h-5.516a6.225 6.225 0 00-6.073 4.863 7.03 7.03 0 01-.144-1.419v-7.925a6.98 6.98 0 012.128-5.027zm1.607 19.146a6.968 6.968 0 003.243.806h3.995a6.968 6.968 0 003.24-.804 4.222 4.222 0 00-2.48-7.64h-5.516a4.222 4.222 0 00-2.482 7.638zm-1.245-9.638c.826 0 1.496-.696 1.496-1.556 0-.859-.67-1.555-1.496-1.555-.827 0-1.497.696-1.497 1.555 0 .86.67 1.556 1.497 1.556zm14.467-1.556c0 .86-.67 1.556-1.497 1.556-.826 0-1.496-.696-1.496-1.556 0-.859.67-1.555 1.496-1.555.827 0 1.497.696 1.497 1.555zm-11.973 8.815c.551 0 .998-.464.998-1.037s-.447-1.037-.998-1.037c-.551 0-.998.464-.998 1.037s.447 1.037.998 1.037zm8.98-1.037c0 .573-.447 1.037-.998 1.037-.55 0-.997-.464-.997-1.037s.446-1.037.997-1.037c.552 0 .998.464.998 1.037z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWCurator = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M16.523 4.168l3.092 2.565h-6.822l3.091-2.565a.5.5 0 01.64 0zm.958-1.155l4.483 3.72.47.39h4.646a.39.39 0 01.098.014l-1.26 1.28H5.933L4.716 7.18a.408.408 0 01.204-.056h5.053l.47-.39 4.484-3.72a2 2 0 012.554 0zm-9.112 7.853h-.022l-1.95-1.979h19.057l-1.949 1.979H8.37zm-2.12 17.312V9.404l1.765 1.791a.868.868 0 00-.044.277v14.665c0 .091.014.178.038.256L6.25 28.178zm-.463.471V8.933L4.423 7.55a1.257 1.257 0 00-.085.464v21.543c0 .173.033.335.088.472l1.36-1.38zm-1.063 1.746l1.22-1.24h20.102l1.232 1.252a.481.481 0 01-.198.04H4.92a.406.406 0 01-.198-.052zm22.853-.35l-1.361-1.384V8.782l1.314-1.333c.083.153.133.35.133.566v21.547c0 .033-.005.265-.086.483zm-3.652-3.709l1.826 1.854V9.253l-1.866 1.895a.848.848 0 01.061.324v14.667c0 .015-.001.098-.021.197zm1.656 2.348l-1.928-1.957a.344.344 0 01-.106.015H8.37a.268.268 0 01-.045-.003l-1.917 1.945H25.58z"
        clipRule="evenodd"
      ></path>
      <path d="M15.868 19.906a2 2 0 013.405 0l4.37 7.089H11.497l4.37-7.089z"></path>
      <path d="M10.428 23.347a2 2 0 013.404 0l2.25 3.648H8.178l2.248-3.648zM11.706 18.049a1.829 1.829 0 100-3.658 1.829 1.829 0 000 3.658z"></path>
    </svg>
  );
};

export const CWDelegate = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        d="M3.09137 17.7684L13.3085 3.98556C13.6333 3.54749 14.325 3.87168 14.196 4.40153L12.0379 13.2704C11.9613 13.5852 12.1997 13.8887 12.5237 13.8887H17.4814C17.8968 13.8887 18.131 14.3659 17.8769 14.6945L7.46001 28.1666C7.13082 28.5924 6.45362 28.2689 6.578 27.7453L8.61208 19.1817C8.6867 18.8676 8.44848 18.5662 8.12562 18.5662H3.49305C3.08231 18.5662 2.84677 18.0984 3.09137 17.7684Z"
        strokeWidth="2"
      />
      <path
        d="M14.0914 17.7684L24.3085 3.98555C24.6333 3.54749 25.325 3.87168 25.196 4.40153L23.0379 13.2704C22.9613 13.5852 23.1997 13.8887 23.5237 13.8887H28.4814C28.8968 13.8887 29.131 14.3659 28.8769 14.6945L18.46 28.1666C18.1308 28.5924 17.4536 28.2689 17.578 27.7453L19.6121 19.1817C19.6867 18.8676 19.4485 18.5662 19.1256 18.5662H14.493C14.0823 18.5662 13.8468 18.0984 14.0914 17.7684Z"
        strokeWidth="2"
      />
    </svg>
  );
};

export const CWDemocraticProposal = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M10.692 3.301c.11-1.343-1.736-1.82-2.29-.592l-1.9 4.212a1.99 1.99 0 00-1.033-.287H4a2 2 0 00-2 2v6a2 2 0 002 2h1.47c.7 0 1.316-.36 1.673-.905l1.858.879c.334.158.7.24 1.069.24h2.963a2.5 2.5 0 002.49-2.287l.515-6.024a2 2 0 00-1.992-2.17h-3.608l.254-3.066zM5.469 8.634H4v6h1.47v-6zM23.644 29.14c-.554 1.229-2.4.75-2.29-.592l.253-3.065H18a2 2 0 01-1.993-2.17l.515-6.025A2.5 2.5 0 0119.012 15h2.964c.37 0 .735.082 1.069.24l1.857.879a1.998 1.998 0 011.674-.905h1.47a2 2 0 012 2v6a2 2 0 01-2 2h-1.47a1.99 1.99 0 01-1.032-.287l-1.9 4.212zm2.932-5.925h1.47v-6h-1.47v6z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWDiscord = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M26.182 8.864s-2.918-2.285-6.364-2.546l-.31.622c3.114.763 4.543 1.854 6.037 3.196C22.97 8.822 20.43 7.591 16 7.591c-4.43 0-6.97 1.23-9.545 2.545 1.494-1.342 3.194-2.555 6.037-3.196l-.31-.622c-3.615.34-6.364 2.546-6.364 2.546S2.56 13.589 2 22.864c3.284 3.788 8.273 3.818 8.273 3.818l1.043-1.39a12.748 12.748 0 01-5.498-3.701c2.06 1.559 5.17 3.182 10.182 3.182 5.011 0 8.121-1.623 10.182-3.182a12.74 12.74 0 01-5.498 3.701l1.043 1.39s4.99-.03 8.273-3.818c-.56-9.275-3.818-14-3.818-14zM11.864 20.318c-1.231 0-2.228-1.139-2.228-2.545 0-1.407.997-2.546 2.228-2.546 1.23 0 2.227 1.14 2.227 2.546s-.997 2.545-2.227 2.545zm8.272 0c-1.23 0-2.227-1.139-2.227-2.545 0-1.407.997-2.546 2.227-2.546 1.231 0 2.228 1.14 2.228 2.546s-.997 2.545-2.228 2.545z"></path>
    </svg>
  );
};

export const CWDots = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M8.059 16a3 3 0 11-6 0 3 3 0 016 0zM18.858 16a3 3 0 11-6 0 3 3 0 016 0zM30.058 16c0 1.657-1.432 3-3.2 3-1.767 0-3.2-1.343-3.2-3s1.433-3 3.2-3c1.768 0 3.2 1.343 3.2 3z"></path>
    </svg>
  );
};

export const CWDotsVertical = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M16 8.059a3 3 0 110-6 3 3 0 010 6zM16 18.858a3 3 0 110-6 3 3 0 010 6zM16 30.058c-1.657 0-3-1.432-3-3.2 0-1.767 1.343-3.2 3-3.2s3 1.433 3 3.2c0 1.768-1.343 3.2-3 3.2z"></path>
    </svg>
  );
};

export const CWDownvote = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M16.73 27.828a.843.843 0 01-1.46 0L2.113 5.018a.845.845 0 01.731-1.268h26.31c.65 0 1.055.704.73 1.267l-13.154 22.81z"></path>
    </svg>
  );
};

export const CWElement = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M12.08 4.18c0-.928.753-1.68 1.68-1.68 6.186 0 11.2 5.014 11.2 11.2a1.68 1.68 0 01-3.36 0 7.84 7.84 0 00-7.84-7.84 1.68 1.68 0 01-1.68-1.68zM19.92 28.82a1.68 1.68 0 01-1.68 1.68c-6.186 0-11.2-5.014-11.2-11.2a1.68 1.68 0 013.36 0 7.84 7.84 0 007.84 7.84c.927 0 1.68.752 1.68 1.68zM3.68 20.42A1.68 1.68 0 012 18.74c0-6.186 5.014-11.2 11.2-11.2a1.68 1.68 0 010 3.36 7.84 7.84 0 00-7.84 7.84 1.68 1.68 0 01-1.68 1.68zM28.32 12.58c.928 0 1.68.752 1.68 1.68 0 6.185-5.014 11.2-11.2 11.2a1.68 1.68 0 110-3.36 7.84 7.84 0 007.84-7.84c0-.928.752-1.68 1.68-1.68z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWExpand = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M15 3a1 1 0 011-1h13a1 1 0 011 1v13a1 1 0 11-2 0V5.414L16.707 16.707a1 1 0 01-1.414-1.414L26.586 4H16a1 1 0 01-1-1z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWExploreCommunities = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M25.84 12.665a9.529 9.529 0 01-1.038 4.34c-.24.437-.649 1.069-.947 1.496l-6.22 9.514c-.62.95-2.012.95-2.633 0L8.901 18.5c-1.064-1.848-2.198-3.392-2.198-5.836a9.569 9.569 0 0119.138 0zm-9.568 6.163a6.163 6.163 0 100-12.326 6.163 6.163 0 000 12.326z"
        clipRule="evenodd"
      ></path>
      <path d="M18.561 12.813a2.303 2.303 0 11-4.607 0 2.303 2.303 0 014.607 0z"></path>
    </svg>
  );
};

export const CWExternalLink = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M5 4.5a1 1 0 00-1 1v22a1 1 0 001 1h22a1 1 0 001-1v-6.357a1 1 0 112 0V27.5a3 3 0 01-3 3H5a3 3 0 01-3-3v-22a3 3 0 013-3h6.357a1 1 0 110 2H5zm10-1a1 1 0 011-1h13a1 1 0 011 1v13a1 1 0 11-2 0V5.914L16.707 17.207a1 1 0 01-1.414-1.414L26.586 4.5H16a1 1 0 01-1-1z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWFeedback = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M2 5.687c0-.38.313-.687.699-.687H29.3c.386 0 .699.308.699.687v20.625c0 .605-.74.915-1.183.495l-4.028-3.808H2.7A.693.693 0 012 22.312V5.687zM8 16a2 2 0 100-4 2 2 0 000 4zm10-2a2 2 0 11-4 0 2 2 0 014 0zm6 2a2 2 0 100-4 2 2 0 000 4z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWFilter = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M13.652 25.102a2 2 0 01-.457-1.272v-5.476L4.38 6.173A2 2 0 016 3h21a2 2 0 011.62 3.173l-8.814 12.18V27a2 2 0 01-3.544 1.271l-2.61-3.17zm4.154-7.397L27 5H6l9.195 12.707v6.123l2.61 3.17v-9.295z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWFlag = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M28 3.278c0-.43-.384-.778-.857-.778H4.857c-.473 0-.857.348-.857.778V29.72c0 .706.953 1.046 1.484.53l9.89-9.624a.918.918 0 011.253 0l9.889 9.624c.53.516 1.484.176 1.484-.53V3.277z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWFlame = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M19.909 30.332c-.215.043-.378-.314-.244-.487 1.575-2.034-.621-6.082-2.787-8.747a1.122 1.122 0 00-1.756 0c-2.166 2.665-4.362 6.713-2.787 8.747.134.173-.029.53-.244.487C-.757 27.749 7.91 11.445 15.085 2.93a1.189 1.189 0 011.83 0c7.176 8.515 15.842 24.82 2.994 27.402z"></path>
    </svg>
  );
};

export const CWGear = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
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
};

export const CWGithub = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M16.067 2.5a13.878 13.878 0 00-9.115 3.417 14.431 14.431 0 00-4.77 8.639 14.61 14.61 0 001.852 9.735 14.11 14.11 0 007.59 6.185c.7.132.958-.308.958-.696v-2.44c-3.925.872-4.753-1.93-4.753-1.93a3.79 3.79 0 00-1.562-2.098c-1.277-.88.095-.88.095-.88.446.062.873.227 1.247.484.373.256.685.597.91.996.19.353.448.665.757.916a2.935 2.935 0 003.332.273 3.096 3.096 0 01.862-1.92c-3.088-.344-6.366-1.578-6.366-7.076a5.618 5.618 0 011.45-3.85 5.266 5.266 0 01.137-3.799s1.182-.387 3.865 1.472a13.05 13.05 0 017.04 0c2.682-1.86 3.864-1.472 3.864-1.472a5.257 5.257 0 01.12 3.798 5.61 5.61 0 011.442 3.85c0 5.517-3.287 6.724-6.419 7.05.334.346.592.76.757 1.216.166.456.234.942.2 1.427v3.939c0 .476.251.828.967.687a14.118 14.118 0 007.484-6.208 14.612 14.612 0 001.806-9.673 14.433 14.433 0 00-4.723-8.585A13.882 13.882 0 0016.068 2.5z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWHamburger = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M2 20c0-.276.348-.5.778-.5h26.444c.43 0 .778.224.778.5v1c0 .276-.348.5-.778.5H2.778c-.43 0-.778-.224-.778-.5v-1zM30 13c0 .276-.348.5-.778.5H2.778c-.43 0-.778-.224-.778-.5v-1c0-.276.348-.5.778-.5h26.444c.43 0 .778.224.778.5v1z"></path>
    </svg>
  );
};

export const CWHash = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M13.994 7.11a1 1 0 00-1.988-.22L11.55 11H7a1 1 0 100 2h4.327l-.666 6H7a1 1 0 100 2h3.438l-.432 3.89a1 1 0 001.988.22L12.45 21h5.987l-.432 3.89a1 1 0 001.988.22L20.45 21H25a1 1 0 100-2h-4.327l.667-6H25a1 1 0 100-2h-3.438l.432-3.89a1 1 0 00-1.988-.22L19.55 11h-5.987l.432-3.89zM13.339 13l-.666 6h5.987l.667-6H13.34z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWHeartEmpty = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M17.204 27.321a2.121 2.121 0 01-2.462.003c-1.655-1.177-4.483-3.34-6.921-5.852-1.219-1.255-2.39-2.649-3.269-4.095C3.688 15.954 3 14.304 3 12.58 3 8.42 6.315 5 10.528 5c2.002 0 3.714.804 4.863 1.524.207.13.402.26.583.39.181-.13.376-.26.584-.39C17.706 5.804 19.418 5 21.42 5A7.58 7.58 0 0129 12.58c0 1.732-.703 3.389-1.577 4.812-.89 1.45-2.076 2.846-3.306 4.102-2.46 2.514-5.3 4.676-6.913 5.827zM16.093 9.55c.544-.52 2.723-2.428 5.327-2.428a5.459 5.459 0 015.459 5.459c0 4.702-7.772 10.775-10.908 13.016-3.21-2.283-10.85-8.314-10.85-13.016 0-3.015 2.392-5.459 5.407-5.459 2.604 0 4.783 1.909 5.327 2.428.06.057.1.098.12.117.018-.02.058-.06.118-.117z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWHeartFilled = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M14.742 27.824a2.121 2.121 0 002.462-.003c1.612-1.151 4.453-3.313 6.913-5.827 1.23-1.256 2.415-2.653 3.306-4.102C28.297 16.47 29 14.812 29 13.08a7.58 7.58 0 00-7.58-7.58c-2.002 0-3.714.804-4.863 1.524-.207.13-.402.26-.583.39a12.42 12.42 0 00-.583-.39c-1.149-.72-2.86-1.524-4.863-1.524C6.315 5.5 3 8.92 3 13.08c0 1.724.688 3.374 1.552 4.797.878 1.447 2.05 2.84 3.269 4.095 2.438 2.511 5.266 4.675 6.921 5.852z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWHelp = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M16 30c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16s6.268 14 14 14zm-3.982-17.702a.466.466 0 00.478.495h.971c.282 0 .503-.235.547-.513a2.75 2.75 0 01.12-.48c.11-.317.278-.606.491-.85.228-.264.506-.467.815-.596.297-.124.614-.176.93-.153a.659.659 0 00.08 0c.292-.014.584.033.86.14.287.11.552.284.779.51.202.215.36.475.465.762.105.288.153.596.141.905.007.426-.072.848-.232 1.236-.194.396-.454.75-.768 1.04l-1.339 1.098c-.436.388-.805.86-1.089 1.392a3.693 3.693 0 00-.339 1.648v.755a.5.5 0 00.5.5h1.107a.5.5 0 00.5-.5v-.638a2.11 2.11 0 01.238-.96c.146-.277.352-.511.599-.681a.583.583 0 00.071-.057l1.02-.969.732-.687c.236-.245.451-.515.643-.804.215-.336.384-.707.5-1.098.11-.427.163-.87.16-1.314a4.584 4.584 0 00-.299-1.755 4.24 4.24 0 00-.932-1.462c-.924-.875-2.12-1.325-3.34-1.255a4.654 4.654 0 00-1.91.392 3.785 3.785 0 00-1.41 1.08c-.354.451-.632.97-.82 1.529-.142.416-.232.85-.269 1.29zm2.665 11.753c.071.193.18.367.317.51.276.246.628.458.982.434l.071-.002c.392.003.773-.15 1.071-.432.142-.142.256-.314.332-.507.077-.192.116-.4.115-.611a1.68 1.68 0 00-.119-.61 1.558 1.558 0 00-.328-.508 1.542 1.542 0 00-1.107-.451 1.297 1.297 0 00-.55.112 1.408 1.408 0 00-.467.339c-.135.145-.24.32-.311.512-.07.192-.105.398-.1.606-.008.207.024.415.095.608z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWHome = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M3.725 16.286l1.84-1.666V28.5a2 2 0 002 2h16.871a2 2 0 002-2V14.65l1.824 1.636c.218.195.57.195.788 0l.789-.707a.464.464 0 000-.707L16.438 2.853a.6.6 0 00-.498-.137.59.59 0 00-.496.137L2.162 14.872a.467.467 0 000 .707l.781.707a.594.594 0 00.782 0z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWInfoEmpty = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M17 21.61c0 .343-.336.621-.75.621h-.5c-.415 0-.75-.278-.75-.622v-7.05c0-.344.335-.623.75-.623h.5c.414 0 .75.279.75.622v7.051zM14.667 11.102a1.334 1.334 0 112.667 0 1.334 1.334 0 01-2.667 0z"></path>
      <path
        fillRule="evenodd"
        d="M16 28c6.627 0 12-5.373 12-12S22.627 4 16 4 4 9.373 4 16s5.373 12 12 12zm0 2c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16s6.268 14 14 14z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWImageUpload = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path d="M25.3332 17.8488C24.9795 17.8488 24.6404 17.9893 24.3904 18.2393C24.1403 18.4894 23.9998 18.8285 23.9998 19.1822V19.6888L22.0265 17.7155C21.3297 17.0242 20.388 16.6363 19.4065 16.6363C18.425 16.6363 17.4833 17.0242 16.7865 17.7155L15.8532 18.6488L12.5465 15.3422C11.84 14.6696 10.9019 14.2945 9.9265 14.2945C8.95108 14.2945 8.01301 14.6696 7.3065 15.3422L5.33317 17.3155V9.84882C5.33317 9.4952 5.47365 9.15606 5.72369 8.90601C5.97374 8.65596 6.31288 8.51549 6.6665 8.51549H15.9998C16.3535 8.51549 16.6926 8.37501 16.9426 8.12496C17.1927 7.87491 17.3332 7.53578 17.3332 7.18215C17.3332 6.82853 17.1927 6.48939 16.9426 6.23934C16.6926 5.9893 16.3535 5.84882 15.9998 5.84882H6.6665C5.60564 5.84882 4.58822 6.27025 3.83808 7.02039C3.08793 7.77054 2.6665 8.78795 2.6665 9.84882V25.8488C2.6665 26.9097 3.08793 27.9271 3.83808 28.6772C4.58822 29.4274 5.60564 29.8488 6.6665 29.8488H22.6665C23.7274 29.8488 24.7448 29.4274 25.4949 28.6772C26.2451 27.9271 26.6665 26.9097 26.6665 25.8488V19.1822C26.6665 18.8285 26.526 18.4894 26.276 18.2393C26.0259 17.9893 25.6868 17.8488 25.3332 17.8488ZM6.6665 27.1822C6.31288 27.1822 5.97374 27.0417 5.72369 26.7916C5.47365 26.5416 5.33317 26.2024 5.33317 25.8488V21.0888L9.19984 17.2222C9.39572 17.0355 9.65592 16.9314 9.9265 16.9314C10.1971 16.9314 10.4573 17.0355 10.6532 17.2222L14.8798 21.4488L20.6132 27.1822H6.6665ZM23.9998 25.8488C23.9979 26.1041 23.9138 26.3519 23.7598 26.5555L17.7465 20.5155L18.6798 19.5822C18.7754 19.4846 18.8895 19.4071 19.0154 19.3542C19.1414 19.3013 19.2766 19.274 19.4132 19.274C19.5498 19.274 19.685 19.3013 19.8109 19.3542C19.9368 19.4071 20.0509 19.4846 20.1465 19.5822L23.9998 23.4622V25.8488ZM30.2798 6.23549L26.2798 2.23549C26.153 2.1141 26.0035 2.01895 25.8398 1.95549C25.5152 1.82213 25.1511 1.82213 24.8265 1.95549C24.6628 2.01895 24.5133 2.1141 24.3865 2.23549L20.3865 6.23549C20.1354 6.48656 19.9944 6.82708 19.9944 7.18215C19.9944 7.53722 20.1354 7.87775 20.3865 8.12882C20.6376 8.37989 20.9781 8.52094 21.3332 8.52094C21.6882 8.52094 22.0288 8.37989 22.2798 8.12882L23.9998 6.39549V13.8488C23.9998 14.2024 24.1403 14.5416 24.3904 14.7916C24.6404 15.0417 24.9795 15.1822 25.3332 15.1822C25.6868 15.1822 26.0259 15.0417 26.276 14.7916C26.526 14.5416 26.6665 14.2024 26.6665 13.8488V6.39549L28.3865 8.12882C28.5105 8.25379 28.6579 8.35298 28.8204 8.42067C28.9829 8.48837 29.1572 8.52322 29.3332 8.52322C29.5092 8.52322 29.6835 8.48837 29.8459 8.42067C30.0084 8.35298 30.1559 8.25379 30.2798 8.12882C30.4048 8.00487 30.504 7.8574 30.5717 7.69492C30.6394 7.53244 30.6742 7.35817 30.6742 7.18215C30.6742 7.00614 30.6394 6.83186 30.5717 6.66938C30.504 6.50691 30.4048 6.35944 30.2798 6.23549Z" />
    </svg>
  );
};

export const CWInfoFilled = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M30 16c0 7.732-6.268 14-14 14S2 23.732 2 16 8.268 2 16 2s14 6.268 14 14zm-15.334-4.898a1.334 1.334 0 112.668 0 1.334 1.334 0 01-2.668 0zM16.25 22.34c.414 0 .75-.278.75-.622v-7.051c0-.344-.336-.622-.75-.622h-.5c-.414 0-.75.278-.75.622v7.051c0 .344.336.622.75.622h.5z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWJar = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M8 2.5a3 3 0 00-1.94 5.288A3.986 3.986 0 005 10.5v17a3 3 0 003 3h16a3 3 0 003-3v-17c0-1.046-.402-2-1.06-2.712A3 3 0 0024 2.5H8zm15 6H9a2 2 0 00-2 2v17a1 1 0 001 1h16a1 1 0 001-1v-17a2 2 0 00-2-2zm0-2h1a1 1 0 100-2H8a1 1 0 000 2h15z"
        clipRule="evenodd"
      ></path>
      <path d="M19 18.5a3 3 0 11-6 0 3 3 0 016 0zM15.026 24.5a3 3 0 11-6 0 3 3 0 016 0zM22.974 24.5a3 3 0 11-6 0 3 3 0 016 0z"></path>
    </svg>
  );
};

export const CWLink = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M16 30.118c7.797 0 14.118-6.321 14.118-14.118 0-7.797-6.321-14.118-14.118-14.118C8.203 1.882 1.882 8.203 1.882 16c0 7.797 6.321 14.118 14.118 14.118zm-4.78-6.05c-1.284-.063-2.387-.73-2.97-2.088-.565-1.312-.378-2.581.607-3.632a94.504 94.504 0 013.874-3.913c1.616-1.531 4.26-1.058 5.328.896.085.155.079.246-.049.38-.314.33-.663.551-1.137.51a.553.553 0 01-.445-.231c-.663-.892-1.842-.984-2.632-.202a427.294 427.294 0 00-3.578 3.584c-.51.517-.68 1.141-.445 1.837.219.636.687 1.015 1.35 1.124.6.1 1.114-.095 1.544-.526.362-.364.726-.727 1.089-1.09a499.07 499.07 0 001.78-1.785.312.312 0 01.365-.095c.594.175 1.22.21 1.83.1a.914.914 0 01.118-.005.718.718 0 01-.061.109 3.54 3.54 0 01-.248.29l-.93.933c-.971.974-1.942 1.948-2.925 2.91-.615.6-1.414.887-2.464.894zm11.96-10.395c.61-.628.88-1.41.889-2.297a4.731 4.731 0 01-.005-.08c0-.03-.002-.06-.004-.092-.117-1.426-.833-2.454-2.145-2.987-1.299-.527-2.546-.327-3.573.646a121.72 121.72 0 00-2.75 2.72c-.369.373-.738.746-1.11 1.118-.082.087-.16.18-.233.275a.784.784 0 00-.067.125l.05-.007.074-.01a3.927 3.927 0 011.83.085c.165.049.256.008.368-.104.61-.61 1.22-1.218 1.832-1.826.344-.341.688-.683 1.03-1.025.431-.43.945-.622 1.547-.52.664.112 1.128.492 1.344 1.128.24.707.051 1.331-.465 1.852a475.005 475.005 0 01-3.549 3.549c-.797.786-1.968.706-2.637-.182a.595.595 0 00-.483-.245c-.487-.032-.831.217-1.143.552a.217.217 0 00-.041.294c1.01 1.97 3.72 2.492 5.328.968 1.142-1.08 2.236-2.207 3.329-3.335l.584-.602z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWLock = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M15.975 5.369a6.37 6.37 0 00-6.37 6.37v1.62h12.789v-1.572a6.418 6.418 0 00-6.419-6.418zm-8.37 6.37v1.62H6.5a.5.5 0 00-.5.5v15.683a.5.5 0 00.5.5h19a.5.5 0 00.5-.5V13.858a.5.5 0 00-.5-.5h-1.106v-1.57c0-4.65-3.77-8.42-8.419-8.42a8.37 8.37 0 00-8.37 8.37zm10.552 6.835c0 .938-.598 1.736-1.434 2.033l.954 3.198a.5.5 0 01-.48.643h-2.394a.5.5 0 01-.48-.643l.955-3.197a2.158 2.158 0 112.879-2.034z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWLogout = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
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
};

export const CWMail = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M5 5.5a3 3 0 00-3 3v16a3 3 0 003 3h22a3 3 0 003-3v-16a3 3 0 00-3-3H5zM4 8.914V24.5a1 1 0 001 1h22a1 1 0 001-1V8.914l-9.879 9.879a3 3 0 01-4.242 0L4 8.914zM26.586 7.5H5.414l9.879 9.879a1 1 0 001.414 0L26.586 7.5z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWMute = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M25.92 4.707a1 1 0 111.415 1.414L6.12 27.335a1 1 0 01-1.414-1.415L25.92 4.707z"></path>
      <path
        fillRule="evenodd"
        d="M17.926 5.644a2.249 2.249 0 10-3.552-.057c-4.42.765-7.782 4.594-7.782 9.203v6.422a.586.586 0 01-.588.583H4.828a.586.586 0 00-.588.584v1.168c0 .322.263.584.588.584h.255L21.788 7.425a9.398 9.398 0 00-3.862-1.78zm1.533 20.909a3.46 3.46 0 11-5.93-2.422h-2.79l13.624-13.624a9.247 9.247 0 011.045 4.283v6.422c0 .322.263.583.588.583h1.176c.325 0 .588.262.588.584v1.168a.586.586 0 01-.588.584H18.47c.612.624.989 1.479.989 2.422zM7.316 24.13h2.01l14.51-14.512a9.397 9.397 0 00-1.29-1.538L6.497 24.13h.82z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWPeople = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M17.18 18.244a3.998 3.998 0 00-1.555-7.68 3.997 3.997 0 00-1.552 7.68 6.501 6.501 0 00-4.926 5.81c-.021.275.204.5.48.5h12a.472.472 0 00.482-.5 6.501 6.501 0 00-4.93-5.81z"></path>
      <path
        fillRule="evenodd"
        d="M26.622 12.56a3.998 3.998 0 01-2.443 3.684 6.501 6.501 0 014.93 5.81c.02.275-.205.5-.481.5h-6.29a7.014 7.014 0 00-3.962-4.436 4.522 4.522 0 001.111-1.253 6.46 6.46 0 011.586-.62 3.998 3.998 0 01-1.067-.665 4.508 4.508 0 00-1.201-4.2 3.999 3.999 0 017.817 1.18zm-7.951-.588a3.981 3.981 0 01.908 3.177 3.981 3.981 0 01-.908-3.177zm-1.023 6.406a6.464 6.464 0 00-1.501 3.675c-.021.276.205.5.48.5h5.187a6.515 6.515 0 00-4.166-4.175zM11.244 15.58a4 4 0 01-1.065.664 6.457 6.457 0 011.58.616c.29.487.67.914 1.117 1.26a7.015 7.015 0 00-3.958 4.433h-6.29a.472.472 0 01-.481-.5 6.501 6.501 0 014.926-5.808 3.998 3.998 0 115.372-4.865 4.508 4.508 0 00-1.201 4.2zm2.363 2.798a6.515 6.515 0 00-4.165 4.175h5.186a.472.472 0 00.48-.5 6.464 6.464 0 00-1.501-3.675zm-1.028-6.406a3.981 3.981 0 01-.908 3.177 3.981 3.981 0 01.908-3.177z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWPerson = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M19.114 17.873A8.002 8.002 0 0016.004 2.5a8 8 0 00-3.107 15.374C7.37 19.23 3.233 24.114 3.01 30c-.01.276.214.501.49.501h25.018a.486.486 0 00.49-.5c-.222-5.889-4.364-10.774-9.894-12.127z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWPin = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M7 18a.5.5 0 01.5-.5h17a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-17A.5.5 0 017 19v-1z"></path>
      <path d="M16.5 7.5c.276 0 .5.275.5.615v20.902c0 .615-.724 1.483-1 1.483s-1-.868-1-1.483V8.115c0-.34.224-.615.5-.615h1zM9 3c0-.276.174-.5.389-.5H22.61c.215 0 .389.224.389.5v1c0 .276-.174.5-.389.5H9.39C9.174 4.5 9 4.276 9 4V3z"></path>
      <path d="M10.556 2.5h10.888L23 19.5H9l1.556-17z"></path>
    </svg>
  );
};

export const CWPlus = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M2 16c0-.276.348-.5.778-.5h26.444c.43 0 .778.224.778.5v1c0 .276-.348.5-.778.5H2.778c-.43 0-.778-.224-.778-.5v-1z"></path>
      <path d="M16.5 2.5c.276 0 .5.348.5.778v26.444c0 .43-.224.778-.5.778h-1c-.276 0-.5-.348-.5-.778V3.278c0-.43.224-.778.5-.778h1z"></path>
    </svg>
  );
};

export const CWPlusCircle = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M30 16.5c0 7.732-6.268 14-14 14s-14-6.268-14-14 6.268-14 14-14 14 6.268 14 14zm-25-.393c0-.217.274-.393.611-.393h9.603V6.111c0-.337.176-.611.393-.611h.786c.217 0 .393.274.393.611v9.603h9.603c.337 0 .611.176.611.393v.786c0 .217-.274.393-.611.393h-9.603v9.603c0 .337-.176.611-.393.611h-.786c-.217 0-.393-.274-.393-.611v-9.603H5.611c-.337 0-.611-.176-.611-.393v-.786z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWSearch = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M25.605 14.866c0 5.93-4.807 10.737-10.738 10.737-5.93 0-10.737-4.807-10.737-10.737S8.937 4.128 14.868 4.128c5.93 0 10.737 4.808 10.737 10.738zm-2.548 9.756a12.686 12.686 0 01-8.19 2.981C7.833 27.603 2.13 21.9 2.13 14.866c0-7.035 5.703-12.738 12.738-12.738 7.034 0 12.737 5.703 12.737 12.738 0 3.118-1.12 5.975-2.981 8.19l5.469 5.469c.096.096-.002.35-.218.565l-.783.784c-.216.216-.47.313-.566.217l-5.469-5.47z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWSend = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M27.432 17.105a.712.712 0 000-1.21L5.24 2.595c-.449-.27-1.01.067-1.01.604v11.103l13.804 1.504c.803.087.803 1.3 0 1.388L4.232 18.7V29.8c0 .537.56.873 1.009.604l22.19-13.3z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWShare = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M29.764 10.918a.482.482 0 000-.836L16.727 2.565a.483.483 0 00-.724.418v6.55a13.26 13.26 0 00-7.641 3.066c-3.565 2.989-6.26 8.376-6.356 17.398a.498.498 0 00.497.503h1c.277 0 .5-.227.503-.503.096-8.624 2.66-13.366 5.641-15.865a11.275 11.275 0 016.356-2.595v6.48c0 .371.402.603.724.418l13.037-7.517z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWShare2 = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M11.53 8.898c.252-.432.396-.932.396-1.466 0-1.62-1.327-2.932-2.963-2.932C7.327 4.5 6 5.812 6 7.432c0 1.619 1.327 2.931 2.963 2.931.546 0 1.058-.146 1.497-.401v.017l9.658 5.517a2.926 2.926 0 000 1.008l-9.67 5.524v.003a2.974 2.974 0 00-1.485-.394C7.327 21.637 6 22.949 6 24.568c0 1.62 1.327 2.932 2.963 2.932 1.636 0 2.963-1.313 2.963-2.931 0-.534-.145-1.035-.397-1.466l9.205-5.259a2.97 2.97 0 002.303 1.088C24.674 18.932 26 17.619 26 16s-1.326-2.931-2.963-2.931c-.93 0-1.76.423-2.303 1.087l-9.205-5.258z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWSidebarCollapse = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M29.604 15.666c0-.276-.242-.5-.54-.5H10.172v2h18.892c.298 0 .54-.224.54-.5v-1zM29.828 23.334c0-.276-.223-.5-.498-.5H12.396a.5.5 0 00-.498.5v1a.5.5 0 00.498.5H29.33a.499.499 0 00.498-.5v-1zM11.69 8.666c0 .276.224.5.499.5h16.934a.499.499 0 00.498-.5v-1c0-.276-.223-.5-.498-.5H12.19a.499.499 0 00-.498.5v1z"></path>
      <path
        fillRule="evenodd"
        d="M2.31 16.405a.275.275 0 010-.477l7.449-4.295a.276.276 0 01.413.239v3.723h7.653c.192 0 .347.156.347.347v.45a.347.347 0 01-.347.346h-7.653v3.724c0 .212-.23.344-.413.238l-7.45-4.295z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWSidebarExpand = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M2.396 15.666c0-.276.242-.5.54-.5h18.892v2H2.936c-.298 0-.54-.224-.54-.5v-1zM2.172 23.334a.5.5 0 01.498-.5h16.934c.275 0 .498.224.498.5v1c0 .276-.223.5-.498.5H2.67a.5.5 0 01-.498-.5v-1zM20.31 8.666c0 .276-.224.5-.499.5H2.877a.499.499 0 01-.498-.5v-1c0-.276.223-.5.498-.5h16.934c.275 0 .498.224.498.5v1z"></path>
      <path
        fillRule="evenodd"
        d="M29.69 16.405a.275.275 0 000-.477l-7.449-4.295a.276.276 0 00-.413.239v3.723h-7.653a.347.347 0 00-.347.347v.45c0 .191.155.346.347.346h7.652v3.724c0 .212.23.344.414.238l7.45-4.295z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWStar = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M13.065 1.469c.326-.861 1.544-.861 1.87 0l1.422 3.753a1 1 0 001.483.482l3.357-2.2c.77-.506 1.755.21 1.513 1.099l-1.056 3.872a1 1 0 00.917 1.262l4.01.192c.919.044 1.295 1.203.577 1.779l-3.13 2.512a1 1 0 000 1.56l3.13 2.512c.718.576.342 1.735-.578 1.779l-4.009.192a1 1 0 00-.917 1.262l1.056 3.873c.242.888-.743 1.604-1.513 1.099l-3.357-2.201a1 1 0 00-1.483.482l-1.422 3.753c-.326.861-1.544.861-1.87 0l-1.422-3.753a1 1 0 00-1.484-.482l-3.356 2.2c-.77.506-1.755-.21-1.513-1.098l1.056-3.873a1 1 0 00-.917-1.262l-4.01-.192C.5 20.027.125 18.868.843 18.292l3.13-2.512a1 1 0 000-1.56l-3.13-2.512C.124 11.132.5 9.973 1.42 9.929l4.009-.192a1 1 0 00.917-1.262L5.29 4.603c-.242-.889.743-1.605 1.513-1.1l3.356 2.201a1 1 0 001.484-.482l1.422-3.753z"></path>
    </svg>
  );
};

export const CWSun = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
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
};

export const CWTelegram = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M25.232 28.084l4.752-22.857a.76.76 0 00-1.019-.864L2.487 14.578c-.653.251-.648 1.177.008 1.422l6.451 2.408 2.498 8.031a.76.76 0 001.206.363l3.596-2.931a1.072 1.072 0 011.308-.037l6.487 4.71a.76.76 0 001.19-.46zm-14.19-10.958L23.65 9.36c.227-.139.46.168.265.348L13.51 19.381c-.366.34-.601.796-.668 1.29l-.355 2.628c-.047.35-.54.385-.636.046l-1.364-4.79a1.27 1.27 0 01.555-1.429z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWTransfer = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.4875 2.85355C15.2923 3.04881 15.2923 3.3654 15.4875 3.56066L18.4269 6.5H8C4.68629 6.5 2 9.18629 2 12.5V19.5C2 22.6454 4.42031 25.2255 7.50015 25.4795C7.77536 25.5022 8 25.2761 8 25V24C8 23.7239 7.77502 23.5033 7.50099 23.4692C5.52736 23.2236 4 21.5401 4 19.5V12.5C4 10.2909 5.79086 8.5 8 8.5H18.3126L15.4764 11.3362C15.2812 11.5315 15.2812 11.848 15.4764 12.0433L16.1836 12.7504C16.3788 12.9457 16.6954 12.9457 16.8907 12.7504L21.0679 8.57317C21.0949 8.55516 21.1205 8.53424 21.1444 8.51041L21.8515 7.8033C22.0467 7.60804 22.0467 7.29145 21.8515 7.09619L16.9017 2.14644C16.7065 1.95118 16.3899 1.95118 16.1946 2.14644L15.4875 2.85355ZM16.5125 19.9536C16.7077 20.1488 16.7077 20.4654 16.5125 20.6607L13.6731 23.5H24C26.2091 23.5 28 21.7091 28 19.5V12.5C28 10.4598 26.4726 8.77643 24.499 8.53082C24.225 8.49672 24 8.27614 24 8V7C24 6.72386 24.2246 6.49783 24.4998 6.52052C27.5797 6.77453 30 9.35462 30 12.5V19.5C30 22.8137 27.3137 25.5 24 25.5H13.5874L16.5236 28.4362C16.7188 28.6315 16.7188 28.948 16.5236 29.1433L15.8164 29.8504C15.6212 30.0457 15.3046 30.0457 15.1093 29.8504L10.9321 25.6732C10.9051 25.6552 10.8795 25.6342 10.8556 25.6104L10.1485 24.9033C9.95326 24.708 9.95326 24.3915 10.1485 24.1962L15.0983 19.2464C15.2935 19.0512 15.6101 19.0512 15.8054 19.2464L16.5125 19.9536Z"
      />
    </svg>
  );
};

export const CWTrash = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M7.119 11.612A2 2 0 019.116 9.5h13.768a2 2 0 011.997 2.112l-.9 16a2 2 0 01-1.997 1.888H10.016a2 2 0 01-1.997-1.888l-.9-16z"></path>
      <path
        fillRule="evenodd"
        d="M16 4.5a2 2 0 00-2 2H8a1 1 0 000 2h16a1 1 0 100-2h-6a2 2 0 00-2-2zM9.917 12.504a1 1 0 011.08.913l1 12a1 1 0 11-1.994.166l-1-12a1 1 0 01.914-1.08zM22.083 12.504a1 1 0 00-1.08.913l-1 12a1 1 0 101.994.166l1-12a1 1 0 00-.914-1.08zM16 12.5a1 1 0 00-1 1v12a1 1 0 102 0v-12a1 1 0 00-1-1z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWTreasuryProposal = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M2 6.5a2 2 0 012-2h4v9H2v-7zm8 7h12v-9H10v9zm14 0v-9h4a2 2 0 012 2v7h-6zM8 15.5H2v11a2 2 0 002 2h4v-13zm2 13h12v-13h-4.268c.17.294.268.636.268 1v2a2 2 0 11-4 0v-2c0-.364.097-.706.268-1H10v13zm14 0h4a2 2 0 002-2v-11h-6v13z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWTwitter = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M28.553 8.978c.02.306.02.613.02.919 0 9.34-6.517 20.103-18.428 20.103-3.67 0-7.078-1.16-9.946-3.172.522.066 1.023.088 1.564.088 3.028 0 5.815-1.116 8.041-3.02-2.847-.065-5.233-2.1-6.056-4.9.401.067.803.11 1.224.11.581 0 1.163-.087 1.704-.24-2.968-.657-5.194-3.5-5.194-6.935v-.087a6.119 6.119 0 002.928.897c-1.744-1.27-2.887-3.435-2.887-5.885 0-1.312.32-2.515.882-3.565 3.188 4.287 7.98 7.087 13.355 7.393a8.668 8.668 0 01-.16-1.618C15.6 5.172 18.486 2 22.075 2c1.865 0 3.55.853 4.732 2.231a12.125 12.125 0 004.11-1.706c-.48 1.64-1.503 3.019-2.846 3.894 1.303-.153 2.566-.547 3.73-1.094a14.679 14.679 0 01-3.25 3.653z"></path>
    </svg>
  );
};

export const CWUnsubscribe = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M18.536 4.737a2.24 2.24 0 01-.495 1.407 9.403 9.403 0 014.171 2.032L5.757 24.63h-.815a.586.586 0 01-.588-.584v-1.168c0-.322.264-.584.588-.584h1.176a.586.586 0 00.588-.584V15.29c0-4.608 3.362-8.438 7.783-9.202a2.249 2.249 0 114.047-1.35zM3.743 28.197a.995.995 0 01.236-.373l3.193-3.193L22.94 8.86l3.665-3.665a1 1 0 011.415 1.414L5.393 29.237a1 1 0 01-1.65-1.04zm7.671-3.566h2.23a3.46 3.46 0 104.94 0h8.702a.586.586 0 00.588-.584v-1.168a.586.586 0 00-.588-.584H26.11a.586.586 0 01-.588-.584V15.29a9.25 9.25 0 00-.86-3.907L11.414 24.631z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWUpvote = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M15.27 4.172a.843.843 0 011.46 0l13.156 22.81a.845.845 0 01-.731 1.268H2.845a.845.845 0 01-.73-1.267l13.154-22.81z"></path>
    </svg>
  );
};

export const CWViews = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path d="M22 16a6 6 0 11-12 0 6 6 0 0112 0z"></path>
      <path
        fillRule="evenodd"
        d="M24.907 19.92C27.144 18.642 28 17.182 28 16s-.856-2.642-3.093-3.92C22.727 10.834 19.582 10 16 10s-6.727.834-8.907 2.08C4.856 13.358 4 14.818 4 16s.856 2.642 3.093 3.92C9.273 21.166 12.418 22 16 22s6.727-.834 8.907-2.08zM16 24c7.732 0 14-3.582 14-8s-6.268-8-14-8-14 3.582-14 8 6.268 8 14 8z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWVote = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 8H4.5C3.11929 8 2 9.11929 2 10.5V27.4956C2 28.8763 3.11929 29.9956 4.5 29.9956H27.5014C28.8821 29.9956 30.0014 28.8763 30.0014 27.4956V10.5C30.0014 9.11928 28.8821 8 27.5014 8H24V10H27.5014C27.7776 10 28.0014 10.2239 28.0014 10.5V27.4956C28.0014 27.7717 27.7776 27.9956 27.5014 27.9956H4.5C4.22386 27.9956 4 27.7717 4 27.4956V10.5C4 10.2239 4.22386 10 4.5 10H8V8Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 1.99841H21.5017C22.8824 1.99841 24.0017 3.1177 24.0017 4.49841V13.5016C24.0017 14.8823 22.8824 16.0016 21.5017 16.0016H10.5C9.11929 16.0016 8 14.8823 8 13.5016V4.49841C8 3.1177 9.11929 1.99841 10.5 1.99841ZM10.5 3.99841C10.2239 3.99841 10 4.22227 10 4.49841V13.5016C10 13.7777 10.2239 14.0016 10.5 14.0016H21.5017C21.7778 14.0016 22.0017 13.7777 22.0017 13.5016V4.49841C22.0017 4.22227 21.7778 3.99841 21.5017 3.99841H10.5ZM12 6.5C12 6.22386 12.2239 6 12.5 6H19.5C19.7761 6 20 6.22386 20 6.5V7.5C20 7.77614 19.7761 8 19.5 8H12.5C12.2239 8 12 7.77614 12 7.5V6.5ZM12.5 10C12.2239 10 12 10.2239 12 10.5V11.5C12 11.7761 12.2239 12 12.5 12H19.5C19.7761 12 20 11.7761 20 11.5V10.5C20 10.2239 19.7761 10 19.5 10H12.5Z"
      />
      <rect x="6" y="14" width="20" height="2" rx="0.5" />
    </svg>
  );
};

export const CWWallet = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M5 5.5a1 1 0 00-1 1v6.798a1 1 0 11-2 0V6.5a3 3 0 013-3h23a1 1 0 110 2H5z"
        clipRule="evenodd"
      ></path>
      <path
        fillRule="evenodd"
        d="M5 7.5a3 3 0 00-3 3v16a3 3 0 003 3h22a3 3 0 003-3v-16a3 3 0 00-3-3H5zm14 8a2 2 0 00-2 2v2a2 2 0 002 2h9v-6h-9z"
        clipRule="evenodd"
      ></path>
      <path d="M27.145 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
    </svg>
  );
};

export const CWWebsite = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M18.011 15.459a.2.2 0 00.2-.203 57.497 57.497 0 00-.293-5.119.2.2 0 00-.199-.178h-3.503a.2.2 0 00-.198.178 57.497 57.497 0 00-.293 5.12.2.2 0 00.2.202h4.086zm1.9 0a.2.2 0 01-.2-.198 59.446 59.446 0 00-.281-5.081.2.2 0 01.2-.221h3.46c.086 0 .162.054.19.136.51 1.558.833 3.301.916 5.157a.199.199 0 01-.199.207h-4.086zM19.2 8.286a.2.2 0 00.199.173h2.936c.146 0 .242-.15.18-.282-.25-.52-.521-1.008-.813-1.462-.935-1.455-2.053-2.524-3.265-3.142-.16-.082-.326.082-.264.25.245.663.462 1.45.65 2.329.14.654.267 1.369.378 2.134zm6.7 7.173a.201.201 0 01-.2-.194 21.196 21.196 0 00-.812-5.047.202.202 0 01.193-.26h3.295c.076 0 .145.043.179.111a13.917 13.917 0 011.382 5.18.198.198 0 01-.198.21h-3.839zm-1.673-7.125a.201.201 0 00.185.125h2.845c.16 0 .254-.178.162-.308a14.049 14.049 0 00-6.132-4.897c-.21-.087-.376.215-.209.37.698.647 1.331 1.417 1.886 2.28.475.74.899 1.554 1.263 2.43zM14.58 6.466a29.903 29.903 0 00-.32 1.764.199.199 0 00.198.229h3.02a.2.2 0 00.197-.23 29.9 29.9 0 00-.32-1.763c-.265-1.24-.572-2.193-.889-2.818-.158-.314-.301-.507-.412-.613a.124.124 0 00-.173 0c-.11.106-.253.3-.412.613-.317.625-.623 1.578-.89 2.818zm-1.467-.314a32.23 32.23 0 00-.377 2.134.2.2 0 01-.198.173H9.6a.197.197 0 01-.179-.282c.249-.52.52-1.008.813-1.462.935-1.455 2.053-2.524 3.265-3.142.16-.082.326.082.264.25a17.21 17.21 0 00-.65 2.329zm-5.175 9.307a.199.199 0 01-.199-.207c.084-1.856.407-3.599.917-5.157a.199.199 0 01.19-.136h3.46a.2.2 0 01.2.22 59.405 59.405 0 00-.281 5.082.2.2 0 01-.2.198H7.937zm-1.901 0a.201.201 0 00.2-.194c.074-1.783.356-3.485.811-5.047a.202.202 0 00-.193-.26H3.561a.198.198 0 00-.179.111A13.916 13.916 0 002 15.25a.198.198 0 00.199.21h3.838zm2.936-9.555c-.476.74-.9 1.554-1.263 2.43a.201.201 0 01-.186.125H4.68a.196.196 0 01-.162-.308 14.048 14.048 0 016.131-4.897c.21-.086.376.215.209.37a11.813 11.813 0 00-1.885 2.28zm8.505 18.055a.2.2 0 01.197.228c-.096.631-.203 1.221-.32 1.764-.265 1.24-.572 2.194-.889 2.819-.158.313-.301.506-.412.612a.124.124 0 01-.173 0c-.11-.106-.253-.299-.412-.613-.317-.624-.623-1.578-.89-2.818a29.9 29.9 0 01-.318-1.764.199.199 0 01.197-.228h3.02zm1.92 0a.2.2 0 00-.198.172c-.111.765-.237 1.48-.378 2.134a17.18 17.18 0 01-.65 2.329c-.062.168.104.332.264.25 1.212-.617 2.33-1.687 3.265-3.141.292-.455.564-.944.813-1.463a.197.197 0 00-.18-.281h-2.936zm3.881-1.637a.199.199 0 01-.189.137h-3.46a.2.2 0 01-.2-.221 59.45 59.45 0 00.281-5.082.2.2 0 01.2-.197h4.086c.114 0 .204.094.2.207a19.426 19.426 0 01-.918 5.156zm1.132 1.637a.201.201 0 00-.185.124c-.364.876-.788 1.69-1.263 2.43a11.81 11.81 0 01-1.885 2.28c-.168.155-.002.457.208.37a14.048 14.048 0 006.132-4.896.196.196 0 00-.162-.308H24.41zm4.143-1.611a.198.198 0 01-.179.11H25.08a.202.202 0 01-.193-.259c.456-1.562.738-3.264.811-5.047a.201.201 0 01.201-.193h3.838c.115 0 .206.096.199.21a13.917 13.917 0 01-1.382 5.179zm-10.636-.068a.2.2 0 01-.199.179h-3.503a.2.2 0 01-.198-.179 57.497 57.497 0 01-.293-5.119.2.2 0 01.2-.202h4.086a.2.2 0 01.2.202 57.497 57.497 0 01-.293 5.12zm-5.612.179a.2.2 0 00.2-.221 59.41 59.41 0 01-.281-5.082.2.2 0 00-.2-.197H7.937a.199.199 0 00-.199.207c.084 1.855.407 3.598.917 5.156a.199.199 0 00.19.137h3.46zm-2.705 1.5a.197.197 0 00-.179.28c.249.52.52 1.01.813 1.464.935 1.454 2.053 2.524 3.265 3.142.16.081.326-.083.264-.251a17.21 17.21 0 01-.65-2.329 32.223 32.223 0 01-.378-2.134.2.2 0 00-.198-.172H9.6zm-2.077 0c.082 0 .155.049.186.124.364.876.787 1.69 1.263 2.43a11.812 11.812 0 001.885 2.28c.167.155.002.456-.21.37a14.049 14.049 0 01-6.13-4.896.196.196 0 01.163-.308h2.843zm-.669-1.5c.135 0 .231-.13.193-.26a21.196 21.196 0 01-.81-5.047.201.201 0 00-.201-.193H2.199a.198.198 0 00-.199.21 13.917 13.917 0 001.382 5.179c.034.068.103.11.179.11h3.294z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWWrite = (props: IconProps) => {
  const {
    className,
    componentType,
    disabled,
    iconButtonTheme,
    iconSize,
    selected,
    ...otherProps
  } = props;
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        d="M5.946 27.517a.5.5 0 01-.607-.567l1.193-7.269-.002-.002L20.867 4.335a2 2 0 012.827-.095l3.654 3.413a2 2 0 01.095 2.827L13.107 25.822l.013.012-7.174 1.683zm5.927-3.445l-3.685.865-.422-.428.642-3.911.064-.069 3.401 3.543zm8.427-16.2l3.71 3.352 1.972-2.11-3.653-3.413L20.3 7.87z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};
