/* eslint-disable max-len */
import React from 'react';

import 'components/component_kit/cw_icon.scss';
import 'components/component_kit/cw_icon_button.scss';

import { getClasses } from '../helpers';
import type { IconProps, IconStyleProps } from './types';

// ADDING ICONS: INSTRUCTIONS
//
// (1) New icon components should be added to this page alphabetically.
// (2) All icons should extend the boilerplate/template provided below.
// (3) You may want to use an SVG to JSX converter such as https://svg2jsx.com/
// (4) Ensure that path and svg tag property casings conform with Mozilla docs
//     For instance:
//       - "fillRule" over "fillRule"
//       - "clipRule" over "clipRule"
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

export const CWArchiveTray = (props: IconProps) => {
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
      className={`${getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType,
      )} archiveTrayIcon`}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 20 20"
      {...otherProps}
    >
      <path
        d="M16.25 3.125H3.75C3.40482 3.125 3.125 3.40482 3.125 3.75V16.25C3.125 16.5952 3.40482 16.875 3.75 16.875H16.25C16.5952 16.875 16.875 16.5952 16.875 16.25V3.75C16.875 3.40482 16.5952 3.125 16.25 3.125Z"
        stroke="#656167"
        strokeWidth="0.9375"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M7.35156 9.22656L10 11.875L12.6484 9.22656"
        stroke="#656167"
        strokeWidth="0.9375"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M10 5.625V11.875"
        stroke="#656167"
        strokeWidth="0.9375"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3.125 12.5H5.99219C6.07334 12.4997 6.15376 12.5154 6.22883 12.5463C6.3039 12.5771 6.37216 12.6224 6.42969 12.6797L7.94531 14.1953C8.00284 14.2526 8.0711 14.2979 8.14617 14.3287C8.22124 14.3596 8.30166 14.3753 8.38281 14.375H11.6172C11.6983 14.3753 11.7788 14.3596 11.8538 14.3287C11.9289 14.2979 11.9972 14.2526 12.0547 14.1953L13.5703 12.6797C13.6278 12.6224 13.6961 12.5771 13.7712 12.5463C13.8462 12.5154 13.9267 12.4997 14.0078 12.5H16.875"
        stroke="#656167"
        strokeWidth="0.9375"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export const CWArchiveTrayFilled = (props: IconProps) => {
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
      className={`${getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType,
      )} archiveTrayIcon`}
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      fill="none"
      viewBox="0 0 17 16"
      {...otherProps}
    >
      <path
        d="M13.16 2H3.16C2.89479 2 2.64043 2.10536 2.4529 2.29289C2.26536 2.48043 2.16 2.73478 2.16 3V9.99375V13C2.16 13.2652 2.26536 13.5196 2.4529 13.7071C2.64043 13.8946 2.89479 14 3.16 14H13.16C13.4252 14 13.6796 13.8946 13.8671 13.7071C14.0546 13.5196 14.16 13.2652 14.16 13V3C14.16 2.73478 14.0546 2.48043 13.8671 2.29289C13.6796 2.10536 13.4252 2 13.16 2ZM5.685 7.025C5.77874 6.93149 5.90573 6.87898 6.03813 6.87898C6.17053 6.87898 6.29752 6.93149 6.39125 7.025L7.66 8.29375V4.5C7.66 4.36739 7.71268 4.24021 7.80645 4.14645C7.90022 4.05268 8.0274 4 8.16 4C8.29261 4 8.41979 4.05268 8.51356 4.14645C8.60733 4.24021 8.66 4.36739 8.66 4.5V8.29375L9.92875 7.025C10.0239 6.93882 10.1485 6.89252 10.2768 6.89568C10.4051 6.89883 10.5273 6.95121 10.618 7.04197C10.7088 7.13273 10.7612 7.25491 10.7643 7.38322C10.7675 7.51153 10.7212 7.63614 10.635 7.73125L8.51625 9.85625H8.50375L8.47875 9.88125H8.46625L8.435 9.9C8.435 9.90625 8.42875 9.90625 8.42875 9.9125L8.3975 9.93125H8.385L8.35375 9.95H8.3475L8.30375 9.96875H8.01625L7.9725 9.95H7.96625L7.935 9.93125H7.9225L7.89125 9.9125C7.89125 9.90625 7.885 9.90625 7.885 9.9L7.85375 9.88125H7.84125L7.81625 9.85625H7.80375L5.685 7.73125C5.5915 7.63752 5.53898 7.51052 5.53898 7.37813C5.53898 7.24573 5.5915 7.11873 5.685 7.025ZM13.16 13H3.16V10.5H4.95375L6.16 11.7063C6.25248 11.7994 6.36251 11.8734 6.48373 11.9238C6.60495 11.9742 6.73497 12.0001 6.86625 12H9.45375C9.58504 12.0001 9.71505 11.9742 9.83627 11.9238C9.9575 11.8734 10.0675 11.7994 10.16 11.7063L11.3663 10.5H13.16V13Z"
        fill="#656167"
      />
    </svg>
  );
};

export const CWArrowDownBlue500 = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M8 2.5V13.5"
        stroke="#338FFF"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3.5 9L8 13.5L12.5 9"
        stroke="#338FFF"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export const CWArrowFatUp = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      {...otherProps}
    >
      <path
        d="M1.25 7.4375L8 0.6875L14.75 7.4375H11.375V13.625C11.375 13.7742 11.3157 13.9173 11.2102 14.0227C11.1048 14.1282 10.9617 14.1875 10.8125 14.1875H5.1875C5.03832 14.1875 4.89524 14.1282 4.78975 14.0227C4.68426 13.9173 4.625 13.7742 4.625 13.625V7.4375H1.25Z"
        stroke="#656167"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export const CWArrowFatUpNeutral = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      {...otherProps}
    >
      <path
        d="M5.0625 9H5.02735L16.2703 8.65547C16.2273 8.75784 16.1549 8.84519 16.0623 8.9065C15.9697 8.96781 15.8611 9.00034 15.75 9H12.9727H12.9375V9.03515V14.625C12.9375 14.9234 12.819 15.2095 12.608 15.4205C12.397 15.6315 12.1109 15.75 11.8125 15.75H6.1875C5.88913 15.75 5.60299 15.6315 5.39201 15.4205C5.18103 15.2095 5.0625 14.9234 5.0625 14.625V9.03515V9ZM16.2377 8.64226C16.1974 8.73806 16.1296 8.81979 16.0429 8.87719C15.9561 8.93467 15.8542 8.96517 15.7501 8.96484H15.75H12.9375H12.9023V9V14.625C12.9023 14.914 12.7875 15.1912 12.5831 15.3956C12.3788 15.6 12.1015 15.7148 11.8125 15.7148H6.1875C5.89846 15.7148 5.62125 15.6 5.41687 15.3956C5.21248 15.1912 5.09766 14.914 5.09766 14.625V9V8.96484H5.0625H2.25H2.24989C2.14578 8.96517 2.0439 8.93467 1.9571 8.87719C1.87042 8.81979 1.80264 8.73806 1.76228 8.64226C1.7243 8.54466 1.71469 8.43832 1.73456 8.33548C1.75441 8.23269 1.80292 8.1376 1.87448 8.06118L8.62396 1.31169C8.62398 1.31167 8.624 1.31165 8.62402 1.31163C8.72408 1.21257 8.85919 1.15699 9 1.15699C9.14081 1.15699 9.27593 1.21257 9.37598 1.31163C9.376 1.31165 9.37602 1.31167 9.37604 1.31169L16.1255 8.06119C16.1971 8.13761 16.2456 8.23269 16.2654 8.33549C16.2853 8.43831 16.2757 8.54466 16.2377 8.64226Z"
        fill="#A09DA1"
        stroke="#A09DA1"
        strokeWidth="0.0703125"
      ></path>
    </svg>
  );
};

export const CWArrowFatUpBlue500 = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      {...otherProps}
    >
      <path
        d="M5.0625 9H5.02734L16.2703 8.65547C16.2273 8.75784 16.1549 8.84519 16.0623 8.9065C15.9697 8.96781 15.8611 9.00034 15.75 9H12.9727H12.9375V9.03515V14.625C12.9375 14.9234 12.819 15.2095 12.608 15.4205C12.397 15.6315 12.1109 15.75 11.8125 15.75H6.1875C5.88913 15.75 5.60298 15.6315 5.39201 15.4205C5.18103 15.2095 5.0625 14.9234 5.0625 14.625V9.03515V9ZM16.2377 8.64226C16.1974 8.73806 16.1296 8.81979 16.0429 8.87719C15.9561 8.93467 15.8542 8.96517 15.7501 8.96484H15.75H12.9375H12.9023V9V14.625C12.9023 14.914 12.7875 15.1912 12.5831 15.3956C12.3788 15.6 12.1015 15.7148 11.8125 15.7148H6.1875C5.89846 15.7148 5.62125 15.6 5.41686 15.3956C5.21248 15.1912 5.09766 14.914 5.09766 14.625V9V8.96484H5.0625H2.25H2.24989C2.14578 8.96517 2.0439 8.93467 1.9571 8.87719C1.87042 8.81979 1.80264 8.73806 1.76227 8.64226C1.7243 8.54466 1.71469 8.43832 1.73455 8.33548C1.75441 8.23269 1.80292 8.1376 1.87447 8.06118L8.62396 1.31169C8.62398 1.31167 8.624 1.31165 8.62402 1.31163C8.72408 1.21257 8.85919 1.15699 9 1.15699C9.14081 1.15699 9.27592 1.21257 9.37598 1.31163C9.376 1.31165 9.37602 1.31167 9.37604 1.31169L16.1255 8.06119C16.1971 8.13761 16.2456 8.23269 16.2654 8.33549C16.2853 8.43831 16.2757 8.54466 16.2377 8.64226Z"
        fill="#338FFF"
        stroke="#338FFF"
        strokeWidth="0.0703125"
      ></path>
    </svg>
  );
};

export const CWArrowFatUpBlue600 = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      {...otherProps}
    >
      <path
        d="M5.0625 9H5.02734L16.2703 8.65547C16.2273 8.75784 16.1549 8.84519 16.0623 8.9065C15.9697 8.96781 15.861 9.00034 15.75 9H12.9727H12.9375V9.03515V14.625C12.9375 14.9234 12.819 15.2095 12.608 15.4205C12.397 15.6315 12.1109 15.75 11.8125 15.75H6.1875C5.88913 15.75 5.60298 15.6315 5.392 15.4205C5.18103 15.2095 5.0625 14.9234 5.0625 14.625V9.03515V9ZM16.2377 8.64226C16.1974 8.73806 16.1296 8.81979 16.0429 8.87719C15.9561 8.93467 15.8542 8.96517 15.7501 8.96484H15.75H12.9375H12.9023V9V14.625C12.9023 14.914 12.7875 15.1912 12.5831 15.3956C12.3787 15.6 12.1015 15.7148 11.8125 15.7148H6.1875C5.89845 15.7148 5.62125 15.6 5.41686 15.3956C5.21248 15.1912 5.09766 14.914 5.09766 14.625V9V8.96484H5.0625H2.25H2.24989C2.14578 8.96517 2.0439 8.93467 1.95709 8.87719C1.87042 8.81979 1.80264 8.73806 1.76227 8.64226C1.7243 8.54466 1.71469 8.43832 1.73455 8.33548C1.75441 8.23269 1.80292 8.1376 1.87447 8.06118L8.62396 1.31169C8.62398 1.31167 8.624 1.31165 8.62402 1.31163C8.72408 1.21257 8.85919 1.15699 9 1.15699C9.14081 1.15699 9.27592 1.21257 9.37598 1.31163C9.376 1.31165 9.37602 1.31167 9.37604 1.31169L16.1255 8.06119C16.1971 8.13761 16.2456 8.23269 16.2654 8.33549C16.2853 8.43831 16.2757 8.54466 16.2377 8.64226Z"
        fill="#2972CC"
        stroke="#2972CC"
        strokeWidth="0.0703125"
      ></path>
    </svg>
  );
};

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
        componentType,
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
        componentType,
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

export const CWArrowUpBlue500 = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M8 13.5V2.5"
        stroke="#338FFF"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3.5 7L8 2.5L12.5 7"
        stroke="#338FFF"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export const CWArrowUpNeutral400 = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M8 13.5V2.5"
        stroke="#A09DA1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {' '}
      </path>
      <path
        d="M3.5 7L8 2.5L12.5 7"
        stroke="#A09DA1"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        componentType,
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
        componentType,
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

export const CWBellNew = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      {...otherProps}
    >
      <path
        d="M6.75 15.75H11.25"
        stroke="#656167"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3.95153 7.31252C3.9506 6.64566 4.0816 5.9852 4.337 5.36919C4.59241 4.75318 4.96716 4.19379 5.43968 3.72323C5.9122 3.25267 6.47315 2.88024 7.09022 2.6274C7.70729 2.37456 8.36828 2.24631 9.03513 2.25002C11.8195 2.27111 14.0484 4.58439 14.0484 7.3758V7.87502C14.0484 10.3922 14.5758 11.8547 15.0398 12.6563C15.0891 12.7416 15.1151 12.8384 15.1152 12.937C15.1153 13.0356 15.0894 13.1325 15.0403 13.2179C14.9912 13.3034 14.9204 13.3744 14.8352 13.4239C14.75 13.4734 14.6532 13.4997 14.5547 13.5H3.44528C3.34671 13.4997 3.24996 13.4734 3.16473 13.4239C3.07949 13.3744 3.00877 13.3034 2.95963 13.2179C2.9105 13.1325 2.88468 13.0356 2.88477 12.937C2.88485 12.8384 2.91084 12.7416 2.96013 12.6563C3.42419 11.8547 3.95153 10.3922 3.95153 7.87502V7.31252Z"
        stroke="#656167"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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

export const CWCode = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M4.84418 6.22217L3.06641 7.99995L4.84418 9.77772"
        stroke="currentColor"
        strokeWidth="1.77841"
      ></path>

      <path
        d="M11.9556 6.22217L13.7333 7.99995L11.9556 9.77772"
        stroke="currentColor"
        strokeWidth="1.77841"
      ></path>

      <path
        d="M9.28852 4.44434L7.51074 11.5554"
        stroke="currentColor"
        strokeWidth="1.77841"
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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

export const CWCosmos = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.12542 1.38109C8.06198 1.32271 8.02925 1.32161 8.02375 1.32161C8.01825 1.32161 7.98552 1.32271 7.92209 1.38109C7.85698 1.441 7.77916 1.54439 7.6953 1.70391C7.52791 2.0223 7.36772 2.50355 7.22963 3.12452C7.07436 3.82283 6.95167 4.67636 6.87427 5.63181C7.24813 5.81272 7.63258 6.00937 8.02366 6.22055C8.4148 6.00934 8.79931 5.81266 9.17323 5.63172C9.09583 4.67631 8.97314 3.82281 8.81788 3.12452C8.6798 2.50355 8.51959 2.0223 8.35222 1.70391C8.26836 1.54439 8.19053 1.441 8.12542 1.38109ZM7.69645 6.39978C7.40925 6.24717 7.1263 6.10281 6.84925 5.96719C6.82825 6.27478 6.81189 6.59184 6.80053 6.91672C6.94706 6.82897 7.09573 6.74156 7.24641 6.65462C7.39708 6.56769 7.54716 6.48272 7.69645 6.39978ZM6.57264 5.4882C6.79702 2.86819 7.36211 1.00911 8.02375 1.00911C8.68539 1.00911 9.25048 2.86814 9.47486 5.48812C11.8574 4.37236 13.7509 3.93195 14.0817 4.50459C14.4125 5.07723 13.0841 6.49583 10.9259 8C13.0841 9.50417 14.4125 10.9228 14.0817 11.4954C13.7509 12.068 11.8574 11.6276 9.47486 10.5119C9.25048 13.1319 8.68539 14.9909 8.02375 14.9909C7.36211 14.9909 6.79702 13.1318 6.57264 10.5118C4.19003 11.6276 2.29644 12.0681 1.96561 11.4954C1.63478 10.9228 2.9632 9.50417 5.12139 8C2.9632 6.49583 1.63478 5.07725 1.96561 4.50459C2.29644 3.93194 4.19003 4.37239 6.57264 5.4882ZM5.39677 7.81069C4.60744 7.26592 3.92908 6.73292 3.40155 6.24934C2.93245 5.81934 2.59552 5.44005 2.40328 5.13598C2.30698 4.98364 2.25633 4.86459 2.23697 4.77833C2.21811 4.69431 2.23352 4.66555 2.2362 4.66092C2.23889 4.65625 2.25619 4.62847 2.33851 4.60275C2.42303 4.57634 2.55158 4.56067 2.73178 4.56784C3.09144 4.58217 3.58862 4.68416 4.1958 4.87514C4.87859 5.08992 5.67959 5.4105 6.54627 5.82123C6.51611 6.23519 6.49431 6.6662 6.48177 7.11019C6.10317 7.34311 5.7405 7.57753 5.39677 7.81069ZM5.39677 8.18931C4.60744 8.73408 3.92908 9.26708 3.40155 9.75066C2.93245 10.1807 2.59552 10.56 2.40328 10.864C2.30698 11.0164 2.25633 11.1354 2.23697 11.2217C2.21811 11.3057 2.23352 11.3345 2.2362 11.3391C2.23887 11.3437 2.25616 11.3715 2.33851 11.3973C2.42303 11.4237 2.55158 11.4393 2.73178 11.4322C3.09144 11.4178 3.58862 11.3158 4.1958 11.1248C4.87859 10.9101 5.67959 10.5895 6.54627 10.1788C6.51611 9.7648 6.49431 9.3338 6.48177 8.8898C6.10317 8.65689 5.7405 8.42247 5.39677 8.18931ZM6.47348 8.51702C6.19758 8.34472 5.93097 8.172 5.67486 8C5.93097 7.828 6.19758 7.65528 6.47348 7.48298C6.4707 7.6537 6.4693 7.82611 6.4693 8C6.4693 8.17389 6.4707 8.3463 6.47348 8.51702ZM6.78983 8.71187C6.78452 8.47798 6.7818 8.2405 6.7818 8C6.7818 7.7595 6.78452 7.52202 6.78983 7.28813C6.98983 7.16659 7.19422 7.04552 7.40258 6.9253C7.61105 6.80502 7.81827 6.68861 8.02366 6.57623C8.22905 6.68861 8.43627 6.80502 8.64472 6.9253C8.85316 7.04556 9.05763 7.16669 9.25767 7.28825C9.26299 7.52209 9.26572 7.75955 9.26572 8C9.26572 8.24045 9.26299 8.47791 9.25767 8.71175C9.05763 8.83331 8.85316 8.95444 8.64472 9.0747C8.43627 9.19498 8.22905 9.31139 8.02366 9.42377C7.81827 9.31139 7.61105 9.19498 7.40259 9.0747C7.19422 8.95448 6.98983 8.83341 6.78983 8.71187ZM6.80053 9.08328C6.81189 9.40816 6.82825 9.72522 6.84925 10.0328C7.1263 9.89719 7.40925 9.75281 7.69645 9.60022C7.54716 9.51728 7.39708 9.43231 7.24641 9.34538C7.09573 9.25844 6.94706 9.17103 6.80053 9.08328ZM8.02366 9.77945C7.63258 9.99063 7.24813 10.1873 6.87427 10.3682C6.95167 11.3236 7.07436 12.1772 7.22963 12.8755C7.36772 13.4965 7.52791 13.9777 7.6953 14.2961C7.77916 14.4556 7.85698 14.559 7.92209 14.6189C7.98552 14.6773 8.01825 14.6784 8.02375 14.6784C8.02925 14.6784 8.06198 14.6773 8.12542 14.6189C8.19053 14.559 8.26836 14.4556 8.35222 14.2961C8.51959 13.9777 8.6798 13.4965 8.81788 12.8755C8.97314 12.1772 9.09583 11.3237 9.17323 10.3683C8.79931 10.1873 8.4148 9.99066 8.02366 9.77945ZM9.50123 10.1789C10.3678 10.5895 11.1688 10.9101 11.8515 11.1248C12.4587 11.3158 12.9559 11.4178 13.3155 11.4322C13.4957 11.4393 13.6243 11.4237 13.7088 11.3973C13.7912 11.3715 13.8084 11.3437 13.8111 11.3391C13.8138 11.3345 13.8292 11.3057 13.8103 11.2217C13.791 11.1354 13.7403 11.0164 13.644 10.864C13.4518 10.56 13.1149 10.1807 12.6458 9.75066C12.1182 9.26708 11.4399 8.73408 10.6505 8.18931C10.3069 8.42242 9.94425 8.65681 9.56575 8.88967C9.5532 9.33375 9.53141 9.76483 9.50123 10.1789ZM10.6505 7.81069C11.4399 7.26592 12.1182 6.73292 12.6458 6.24934C13.1149 5.81934 13.4518 5.44005 13.644 5.13598C13.7403 4.98364 13.791 4.86459 13.8103 4.77833C13.8292 4.69428 13.8138 4.66553 13.8111 4.66092C13.8084 4.65627 13.7912 4.62848 13.7088 4.60275C13.6243 4.57634 13.4957 4.56067 13.3155 4.56784C12.9559 4.58217 12.4587 4.68416 11.8515 4.87514C11.1688 5.08991 10.3678 5.41045 9.50123 5.82114C9.53141 6.23517 9.5532 6.66625 9.56575 7.11031C9.94425 7.34319 10.3069 7.57758 10.6505 7.81069ZM9.57403 7.48311C9.84986 7.65536 10.1164 7.82805 10.3724 8C10.1164 8.17195 9.84986 8.34464 9.57403 8.51689C9.5768 8.34622 9.57822 8.17384 9.57822 8C9.57822 7.82616 9.5768 7.65378 9.57403 7.48311ZM9.24698 6.91684C9.23563 6.59189 9.21925 6.27477 9.19825 5.96709C8.92114 6.10275 8.63813 6.24714 8.35086 6.39978C8.50016 6.48272 8.65024 6.56769 8.80089 6.65462C8.95164 6.74159 9.10039 6.82905 9.24698 6.91684ZM9.19825 10.0329C8.92114 9.89725 8.63813 9.75286 8.35086 9.60022C8.50016 9.51728 8.65024 9.43231 8.80089 9.34538C8.95164 9.25841 9.10039 9.17095 9.24698 9.08316C9.23563 9.40811 9.21925 9.72523 9.19825 10.0329Z"
        fill="#656167"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.55544 6.04223C3.82695 6.04223 4.04705 6.26244 4.04705 6.53406C4.04705 6.8057 3.82695 7.02591 3.55544 7.02591C3.28394 7.02591 3.06384 6.8057 3.06384 6.53406C3.06384 6.26244 3.28394 6.04223 3.55544 6.04223Z"
        fill="#656167"
      ></path>
      <path
        xmlns="http://www.w3.org/2000/svg"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.3686 4.35797C11.6402 4.35797 11.8604 4.57817 11.8604 4.84981C11.8604 5.12145 11.6402 5.34166 11.3686 5.34166C11.0969 5.34166 10.8767 5.12145 10.8767 4.84981C10.8767 4.57817 11.0969 4.35797 11.3686 4.35797Z"
        fill="#656167"
      ></path>
      <path
        xmlns="http://www.w3.org/2000/svg"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.0331 12.0777C7.30474 12.0777 7.52495 12.2978 7.52495 12.5693C7.52495 12.8408 7.30474 13.0609 7.0331 13.0609C6.76146 13.0609 6.54126 12.8408 6.54126 12.5693C6.54126 12.2978 6.76146 12.0777 7.0331 12.0777Z"
        fill="#656167"
      ></path>
      <path
        xmlns="http://www.w3.org/2000/svg"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.99629 7.16364C8.45618 7.16364 8.829 7.53647 8.829 7.99636C8.829 8.45625 8.45618 8.82906 7.99629 8.82906C7.5364 8.82906 7.16357 8.45625 7.16357 7.99636C7.16357 7.53647 7.5364 7.16364 7.99629 7.16364Z"
        fill="#656167"
      ></path>
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      style={{ fill: '#5865F2' }} // Imp: this enforces the discord color
      {...otherProps}
    >
      <path d="M26.182 8.864s-2.918-2.285-6.364-2.546l-.31.622c3.114.763 4.543 1.854 6.037 3.196C22.97 8.822 20.43 7.591 16 7.591c-4.43 0-6.97 1.23-9.545 2.545 1.494-1.342 3.194-2.555 6.037-3.196l-.31-.622c-3.615.34-6.364 2.546-6.364 2.546S2.56 13.589 2 22.864c3.284 3.788 8.273 3.818 8.273 3.818l1.043-1.39a12.748 12.748 0 01-5.498-3.701c2.06 1.559 5.17 3.182 10.182 3.182 5.011 0 8.121-1.623 10.182-3.182a12.74 12.74 0 01-5.498 3.701l1.043 1.39s4.99-.03 8.273-3.818c-.56-9.275-3.818-14-3.818-14zM11.864 20.318c-1.231 0-2.228-1.139-2.228-2.545 0-1.407.997-2.546 2.228-2.546 1.23 0 2.227 1.14 2.227 2.546s-.997 2.545-2.227 2.545zm8.272 0c-1.23 0-2.227-1.139-2.227-2.545 0-1.407.997-2.546 2.227-2.546 1.231 0 2.228 1.14 2.228 2.546s-.997 2.545-2.228 2.545z"></path>
    </svg>
  );
};

export const CWDiscordLogin = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="12"
      fill="none"
      viewBox="0 0 16 12"
      {...otherProps}
    >
      <path
        d="M15.4562 8.6125L13.3312 1.5375C13.2904 1.3944 13.2173 1.26256 13.1177 1.15206C13.018 1.04156 12.8944 0.955335 12.7562 0.899999H12.7187L12.7562 0.887499C12.059 0.608119 11.3371 0.394687 10.6 0.249999C10.5355 0.237264 10.4692 0.237347 10.4048 0.250244C10.3404 0.263142 10.2792 0.2886 10.2247 0.325165C10.1701 0.36173 10.1233 0.408685 10.0869 0.463349C10.0505 0.518012 10.0252 0.579313 10.0125 0.643749C9.99881 0.707806 9.99802 0.773942 10.0102 0.838307C10.0223 0.902671 10.0471 0.963977 10.0832 1.01865C10.1193 1.07333 10.1658 1.12029 10.2202 1.15679C10.2746 1.19328 10.3357 1.2186 10.4 1.23125C10.6812 1.2875 10.9562 1.35625 11.225 1.43125C11.324 1.48263 11.4029 1.56563 11.4493 1.66705C11.4957 1.76847 11.5069 1.8825 11.481 1.99098C11.4551 2.09947 11.3937 2.1962 11.3066 2.26578C11.2194 2.33536 11.1115 2.37381 11 2.375H10.95C9.98683 2.12382 8.99534 1.99778 7.99998 2C7.02801 1.9971 6.05969 2.11893 5.11873 2.3625C4.99899 2.39409 4.87179 2.38013 4.76176 2.32331C4.65173 2.26649 4.5667 2.17087 4.52313 2.05495C4.47957 1.93903 4.48057 1.81107 4.52594 1.69585C4.57131 1.58063 4.65783 1.48634 4.76873 1.43125H4.77498C5.04373 1.35625 5.31873 1.2875 5.59998 1.23125C5.66442 1.21854 5.72572 1.19326 5.78038 1.15685C5.83504 1.12045 5.882 1.07363 5.91856 1.01907C5.95513 0.964512 5.98059 0.903286 5.99348 0.838887C6.00638 0.774488 6.00646 0.70818 5.99373 0.643749C5.96657 0.514423 5.88991 0.400844 5.78014 0.327272C5.67036 0.2537 5.53617 0.225968 5.40623 0.249999C4.6665 0.397923 3.94243 0.615561 3.24373 0.899999C3.10559 0.955335 2.98196 1.04156 2.88229 1.15206C2.78262 1.26256 2.70957 1.3944 2.66873 1.5375L0.54373 8.6125C0.488603 8.79747 0.488185 8.99445 0.542527 9.17966C0.596869 9.36486 0.703649 9.53039 0.84998 9.65625C0.907475 9.71163 0.967984 9.76379 1.03123 9.8125H1.03748C2.04998 10.6375 3.38123 11.2687 4.88123 11.6312C4.91962 11.6435 4.95967 11.6499 4.99998 11.65C5.1236 11.652 5.24356 11.608 5.33671 11.5267C5.42985 11.4454 5.48957 11.3325 5.50433 11.2098C5.51909 11.087 5.48785 10.9631 5.41663 10.8621C5.34542 10.761 5.23929 10.6899 5.11873 10.6625C4.44439 10.4996 3.78879 10.2671 3.16248 9.96875C3.07676 9.88843 3.02206 9.78049 3.00797 9.66386C2.99388 9.54724 3.0213 9.42938 3.08542 9.33095C3.14955 9.23253 3.24628 9.15982 3.35866 9.12559C3.47103 9.09136 3.59187 9.09779 3.69998 9.14375C4.88748 9.66875 6.38123 10 7.99998 10C9.61873 10 11.1125 9.66875 12.3 9.14375C12.4081 9.09779 12.5289 9.09136 12.6413 9.12559C12.7537 9.15982 12.8504 9.23253 12.9145 9.33095C12.9787 9.42938 13.0061 9.54724 12.992 9.66386C12.9779 9.78049 12.9232 9.88843 12.8375 9.96875C12.2112 10.2671 11.5556 10.4996 10.8812 10.6625C10.7607 10.6899 10.6545 10.761 10.5833 10.8621C10.5121 10.9631 10.4809 11.087 10.4956 11.2098C10.5104 11.3325 10.5701 11.4454 10.6633 11.5267C10.7564 11.608 10.8764 11.652 11 11.65C11.0403 11.6499 11.0803 11.6435 11.1187 11.6312C12.6187 11.2687 13.95 10.6375 14.9625 9.8125H14.9687C15.032 9.76379 15.0925 9.71163 15.15 9.65625C15.2963 9.53039 15.4031 9.36486 15.4574 9.17966C15.5118 8.99445 15.5114 8.79747 15.4562 8.6125ZM5.99998 7.75C5.85164 7.75 5.70664 7.70601 5.5833 7.6236C5.45997 7.54119 5.36384 7.42406 5.30707 7.28701C5.2503 7.14997 5.23545 6.99917 5.26439 6.85368C5.29333 6.7082 5.36476 6.57456 5.46965 6.46967C5.57454 6.36478 5.70818 6.29335 5.85366 6.26441C5.99915 6.23547 6.14995 6.25032 6.28699 6.30709C6.42404 6.36385 6.54117 6.45998 6.62358 6.58332C6.70599 6.70666 6.74998 6.85166 6.74998 7C6.74998 7.19891 6.67096 7.38968 6.53031 7.53033C6.38966 7.67098 6.19889 7.75 5.99998 7.75ZM9.99998 7.75C9.85164 7.75 9.70664 7.70601 9.5833 7.6236C9.45997 7.54119 9.36384 7.42406 9.30707 7.28701C9.25031 7.14997 9.23545 6.99917 9.26439 6.85368C9.29333 6.7082 9.36476 6.57456 9.46965 6.46967C9.57454 6.36478 9.70818 6.29335 9.85366 6.26441C9.99915 6.23547 10.1499 6.25032 10.287 6.30709C10.424 6.36385 10.5412 6.45998 10.6236 6.58332C10.706 6.70666 10.75 6.85166 10.75 7C10.75 7.19891 10.671 7.38968 10.5303 7.53033C10.3897 7.67098 10.1989 7.75 9.99998 7.75Z"
        fill="#656167"
      ></path>
    </svg>
  );
};

export const CWDot = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="4"
      height="4"
      fill="none"
      viewBox="0 0 4 4"
      {...otherProps}
    >
      <path
        xmlns="http://www.w3.org/2000/svg"
        d="M2.004 3.108C1.628 3.108 1.304 2.972 1.032 2.7C0.768 2.428 0.636 2.104 0.636 1.728C0.636 1.344 0.768 1.02 1.032 0.756C1.304 0.484 1.628 0.348 2.004 0.348C2.388 0.348 2.712 0.484 2.976 0.756C3.248 1.02 3.384 1.344 3.384 1.728C3.384 2.104 3.248 2.428 2.976 2.7C2.712 2.972 2.388 3.108 2.004 3.108Z"
        fill="#656167"
      />
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
        componentType,
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

export const CWDotsHorizontal = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M8.96875 8C8.96875 8.53503 8.53503 8.96875 8 8.96875C7.46497 8.96875 7.03125 8.53503 7.03125 8C7.03125 7.46497 7.46497 7.03125 8 7.03125C8.53503 7.03125 8.96875 7.46497 8.96875 8Z"
        fill="#656167"
        stroke="#656167"
        strokeWidth="0.0625"
      ></path>
      <path
        xmlns="http://www.w3.org/2000/svg"
        d="M4 9C4.55228 9 5 8.55228 5 8C5 7.44772 4.55228 7 4 7C3.44772 7 3 7.44772 3 8C3 8.55228 3.44772 9 4 9Z"
        fill="#656167"
      ></path>
      <path
        xmlns="http://www.w3.org/2000/svg"
        d="M12 9C12.5523 9 13 8.55228 13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8C11 8.55228 11.4477 9 12 9Z"
        fill="#656167"
      ></path>
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
        componentType,
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

export const CWEdgeware = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <mask
        xmlns="http://www.w3.org/2000/svg"
        id="mask0_1396_13825"
        style={{ maskType: 'luminance' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="16"
        height="16"
      >
        <circle cx="8" cy="8" r="8" fill="white" />
      </mask>
      <g xmlns="http://www.w3.org/2000/svg" mask="url(#mask0_1396_13825)">
        <rect width="16" height="16" fill="url(#patternCWEdgeware)" />
      </g>
      <defs xmlns="http://www.w3.org/2000/svg">
        <pattern
          id="patternCWEdgeware"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use
            xmlnsXlink="http://www.w3.org/1999/xlink"
            xlinkHref="#image0_1396_13825"
            transform="scale(0.00390625)"
          />
        </pattern>
        <image
          id="image0_1396_13825"
          width="256"
          height="256"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          xlinkHref="data:image/png;base64,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6b2ftL+ooVNtBc3uuyhnKuq8eddzUffZjecNDgCSzeeee27amGn4+a+++sqdf/75bsiQIQ2DKS/HVOAvtthibuzYse7xxx93//zzT8P7SfNPNRSuv/76De+72xw1r3rutnKXcb9BAcBn/zfffDNNrMR+Vuc77LDD3LLLLlv3bJ3VMX2GHjFihJs+fbqbO3du7L2k+cCJJ54IADJ09S4jADt9jaAAoMrUq7+ddtrJ3X///anbAFoFl2ajeeSRR6IJQHQNZe0sAND39ahyzjnnuC+++KLVpVMf+/TTT92UKVPcyiuv3LINo9POl/T6Weo56TWsfi44AMiQCq6lllrKHXTQQe61115LHUCtvvDzzz+7G2+80W200UYRAHbeeefEoNFUVerBpzcUaqR8/fXXW10q9TG98rzhhhty7/Lc6eAAAAwGaiuTCQSrrLKKO/vss3PPsp999lnUxfiQQw5JDIBHH33U7bLLLtH04EmnEk9CAakTrTkgGHl10umgzfP6AAAAtAUAOWHtc/Ytt9zifvnllyQxlegzam3Xazq9PkyyST3EdUxKcp7az6h94tBDD3XLLLNMXftEngHY6XMBAADQNgC880oNqKV91113za2lvTYQy/5dbyjOO+88t/rqqwcb+N52AAAAZAaAdyaBQO/ajzzySPf222+XHbeZr+f7KGjxC5XJKxxfvhD3AAAA5AYAHyAKHPW2u/DCC9vqbZc5klOewPdS3H333RP1UvTlDGEPAABA7gBQYAgC6ji0xRZbOA2iUT/6Km7vvvuuO+aYY1KNUwgh8H0ZAAAAKAQA3sH0WKARdxpEo370SRv1ioaFRipecsklbu211zYh9b09+u4BAAAoFADe4QQCP+b+/fffLzq+m57/999/d3feeWemuQp8mULYAwAAUAoAfLDo0WDo0KHuiiuumGfWnaZRm8MBvVZ8/vnn3T777OOWWGKJ4Fv3fX3H7QEAACgVAHJIQUC99rbddlt3zz33OGXlIrePPvrInXTSSW6FFVYg8Pv03wcAAKB0APisJOdT+4Aa4dSRp4jtsccecxtssEEU+AKPvzb7/3N8AAAAOhIUvvOQuu9qIFDS5anTQuLLL790U6dONdGppx2oAQAAUCoAfBbeeOON3c0335xr9+FWcHjjjTeC79YLAIoL5nbqNsjRgO1UhP+Osv6qq64aDSD6/PPP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"
        />
      </defs>
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
        componentType,
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

export const CWEnvelope = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M2 3.5H14V12C14 12.1326 13.9473 12.2598 13.8536 12.3536C13.7598 12.4473 13.6326 12.5 13.5 12.5H2.5C2.36739 12.5 2.24021 12.4473 2.14645 12.3536C2.05268 12.2598 2 12.1326 2 12V3.5Z"
        stroke="#656167"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M14 3.5L8 9L2 3.5"
        stroke="#656167"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export const CWEthereum = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M7.99835 0.672501L3.50085 8.13583L7.99835 6.09167V0.672501Z"
        fill="#656167"
      ></path>
      <path
        d="M7.99835 6.09167L3.50085 8.13584L7.99835 10.795V6.09167Z"
        fill="#656167"
      ></path>
      <path
        d="M12.4966 8.13583L7.99829 0.672501V6.09167L12.4966 8.13583Z"
        fill="#656167"
      ></path>
      <path
        d="M7.99829 10.795L12.4966 8.13584L7.99829 6.09167V10.795Z"
        fill="#656167"
      ></path>
      <path
        d="M3.50085 8.98917L7.99835 15.3275V11.6467L3.50085 8.98917Z"
        fill="#656167"
      ></path>
      <path
        d="M7.99829 11.6467V15.3275L12.4991 8.98917L7.99829 11.6467Z"
        fill="#656167"
      ></path>
    </svg>
  );
};

export const CWEtherscan = (props: IconProps) => {
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
      width="15"
      height="14"
      viewBox="0 0 15 14"
      fill="none"
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType,
      )}
      {...otherProps}
    >
      <path
        d="M3.41475 6.65794C3.41475 6.33478 3.68022 6.06932 4.00281 6.06932H4.99467C5.31782 6.06932 5.59449 6.33478 5.59449 6.6697V10.4103C5.70986 10.3756 5.8482 10.3409 6.01005 10.3061C6.22904 10.2485 6.39089 10.0524 6.39089 9.82114V5.17995C6.39089 4.85679 6.65636 4.57957 6.99071 4.57957H7.98258C8.30573 4.57957 8.5824 4.84503 8.5824 5.17995V9.48678C8.5824 9.48678 8.8249 9.38261 9.06685 9.279C9.25167 9.19836 9.36704 9.0253 9.36704 8.81696V3.67955C9.36704 3.3564 9.6325 3.07917 9.95566 3.07917H10.9475C11.2707 3.07917 11.5361 3.34464 11.5361 3.67955V7.91694C12.3897 7.2936 13.2667 6.54313 13.9589 5.64255C14.1667 5.37709 14.2244 5.03041 14.109 4.70726C12.8399 1.05905 8.84898 -0.88099 5.20357 0.389219C1.55816 1.65943 -0.379636 5.65375 0.888893 9.30253C1.02723 9.71809 1.21205 10.1107 1.43103 10.4915C1.60409 10.7917 1.92724 10.9648 2.27335 10.9301C2.45817 10.9183 2.68892 10.8953 2.97679 10.8606C3.23049 10.8376 3.41531 10.6181 3.41531 10.3638L3.41475 6.65794Z"
        fill="#3D3A3E"
      />
      <path
        d="M3.39136 12.6609C6.5176 14.9353 10.89 14.2425 13.1621 11.114C14.0274 9.91328 14.5001 8.47001 14.5001 6.99258C14.5001 6.83072 14.4883 6.66942 14.4771 6.50757C11.9283 10.3288 7.20983 12.1182 3.39136 12.6609Z"
        fill="#3D3A3E"
      />
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
        componentType,
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
        componentType,
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
        {
          className: `${className} external-link-icon`,
          disabled,
          iconButtonTheme,
          iconSize,
          selected,
        },
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M13.5 6.25V2.5H9.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 7L13.5 2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M11.5 9V13C11.5 13.1326 11.4473 13.2598 11.3536 13.3536C11.2598 13.4473 11.1326 13.5 11 13.5H3C2.86739 13.5 2.74021 13.4473 2.64645 13.3536C2.55268 13.2598 2.5 13.1326 2.5 13V5C2.5 4.86739 2.55268 4.74021 2.64645 4.64645C2.74021 4.55268 2.86739 4.5 3 4.5H7"
        // stroke="#338FFF"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 14 14"
      {...otherProps}
    >
      <path
        d="M7 0.5C5.71442 0.5 4.45772 0.881218 3.3888 1.59545C2.31988 2.30968 1.48676 3.32484 0.994786 4.51256C0.502816 5.70028 0.374095 7.00721 0.624899 8.26809C0.875703 9.52896 1.49477 10.6872 2.40381 11.5962C3.31285 12.5052 4.47104 13.1243 5.73192 13.3751C6.99279 13.6259 8.29973 13.4972 9.48744 13.0052C10.6752 12.5132 11.6903 11.6801 12.4046 10.6112C13.1188 9.54229 13.5 8.28558 13.5 7C13.4982 5.27665 12.8128 3.62441 11.5942 2.40582C10.3756 1.18722 8.72335 0.50182 7 0.5ZM7 12.5C5.91221 12.5 4.84884 12.1774 3.94437 11.5731C3.0399 10.9687 2.33495 10.1098 1.91867 9.10476C1.50238 8.09977 1.39347 6.9939 1.60568 5.927C1.8179 4.86011 2.34173 3.8801 3.11092 3.11091C3.8801 2.34172 4.86011 1.8179 5.92701 1.60568C6.9939 1.39346 8.09977 1.50238 9.10476 1.91866C10.1098 2.33494 10.9687 3.03989 11.5731 3.94436C12.1774 4.84883 12.5 5.9122 12.5 7C12.4983 8.45818 11.9184 9.85617 10.8873 10.8873C9.85617 11.9184 8.45819 12.4983 7 12.5ZM8 10C8 10.1326 7.94732 10.2598 7.85356 10.3536C7.75979 10.4473 7.63261 10.5 7.5 10.5C7.23479 10.5 6.98043 10.3946 6.7929 10.2071C6.60536 10.0196 6.5 9.76522 6.5 9.5V7C6.36739 7 6.24022 6.94732 6.14645 6.85355C6.05268 6.75979 6 6.63261 6 6.5C6 6.36739 6.05268 6.24021 6.14645 6.14645C6.24022 6.05268 6.36739 6 6.5 6C6.76522 6 7.01957 6.10536 7.20711 6.29289C7.39465 6.48043 7.5 6.73478 7.5 7V9.5C7.63261 9.5 7.75979 9.55268 7.85356 9.64645C7.94732 9.74021 8 9.86739 8 10ZM6 4.25C6 4.10166 6.04399 3.95666 6.1264 3.83332C6.20881 3.70999 6.32595 3.61386 6.46299 3.55709C6.60003 3.50032 6.75083 3.48547 6.89632 3.51441C7.04181 3.54335 7.17544 3.61478 7.28033 3.71967C7.38522 3.82456 7.45665 3.9582 7.48559 4.10368C7.51453 4.24917 7.49968 4.39997 7.44291 4.53701C7.38615 4.67406 7.29002 4.79119 7.16668 4.8736C7.04334 4.95601 6.89834 5 6.75 5C6.55109 5 6.36032 4.92098 6.21967 4.78033C6.07902 4.63968 6 4.44891 6 4.25Z"
        fill="#A09DA1"
      />
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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

export const CWNear = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M12.6745 2.04692C12.2301 2.04692 11.8175 2.27734 11.5846 2.65613L9.07634 6.38013C8.99463 6.50286 9.0278 6.66833 9.15053 6.75004C9.25001 6.81636 9.38163 6.80816 9.47223 6.73021L11.9412 4.58873C11.9822 4.55181 12.0455 4.55557 12.0824 4.59659C12.0992 4.6154 12.108 4.63967 12.108 4.66463V11.3694C12.108 11.4248 12.0633 11.4692 12.0079 11.4692C11.9781 11.4692 11.9501 11.4562 11.9313 11.4333L4.46793 2.49956C4.22485 2.21273 3.86794 2.04726 3.49223 2.04692H3.23138C2.52542 2.04692 1.95312 2.61921 1.95312 3.32518V12.7683C1.95312 13.4743 2.52542 14.0466 3.23138 14.0466C3.67581 14.0466 4.08845 13.8162 4.32126 13.4374L6.82957 9.71337C6.91127 9.59064 6.87811 9.42518 6.75538 9.34347C6.6559 9.27715 6.52428 9.28535 6.43368 9.3633L3.96469 11.5048C3.92367 11.5417 3.86042 11.5379 3.8235 11.4969C3.80675 11.4781 3.79786 11.4538 3.7982 11.4289V4.7224C3.7982 4.66702 3.84299 4.62258 3.89837 4.62258C3.92777 4.62258 3.95614 4.63557 3.97495 4.65847L11.4373 13.594C11.6804 13.8808 12.0373 14.0462 12.413 14.0466H12.6738C13.3798 14.0469 13.9524 13.475 13.9531 12.769V3.32518C13.9531 2.61921 13.3808 2.04692 12.6749 2.04692H12.6745Z"
        fill="#656167"
      ></path>
    </svg>
  );
};

export const CWNewStar = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path d="m8.669 10.969-1.2 3.256a.5.5 0 0 1-.938 0l-1.2-3.256a.506.506 0 0 0-.3-.3l-3.256-1.2a.5.5 0 0 1 0-.938l3.256-1.2a.506.506 0 0 0 .3-.3l1.2-3.256a.5.5 0 0 1 .938 0l1.2 3.256a.506.506 0 0 0 .3.3l3.256 1.2a.5.5 0 0 1 0 .938l-3.256 1.2a.507.507 0 0 0-.3.3v0ZM11 1v3m1.5-1.5h-3m4.5 2v2m1-1h-2" />
    </svg>
  );
};

export const CWOctocat = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M14 14C14 14.1326 13.9473 14.2598 13.8536 14.3536C13.7598 14.4473 13.6326 14.5 13.5 14.5C12.9701 14.4984 12.4623 14.2871 12.0876 13.9124C11.7129 13.5377 11.5016 13.0299 11.5 12.5V12C11.5 11.7348 11.3946 11.4804 11.2071 11.2929C11.0196 11.1054 10.7652 11 10.5 11H9.75V13.5C9.75 13.7652 9.85536 14.0196 10.0429 14.2071C10.2304 14.3946 10.4848 14.5 10.75 14.5C10.8826 14.5 11.0098 14.5527 11.1036 14.6464C11.1973 14.7402 11.25 14.8674 11.25 15C11.25 15.1326 11.1973 15.2598 11.1036 15.3536C11.0098 15.4473 10.8826 15.5 10.75 15.5C10.2201 15.4984 9.71232 15.2871 9.33761 14.9124C8.96289 14.5377 8.75165 14.0299 8.75 13.5V11H7.25V13.5C7.24835 14.0299 7.03711 14.5377 6.66239 14.9124C6.28768 15.2871 5.77993 15.4984 5.25 15.5C5.11739 15.5 4.99021 15.4473 4.89645 15.3536C4.80268 15.2598 4.75 15.1326 4.75 15C4.75 14.8674 4.80268 14.7402 4.89645 14.6464C4.99021 14.5527 5.11739 14.5 5.25 14.5C5.51522 14.5 5.76957 14.3946 5.95711 14.2071C6.14464 14.0196 6.25 13.7652 6.25 13.5V11H5.5C5.23478 11 4.98043 11.1054 4.79289 11.2929C4.60536 11.4804 4.5 11.7348 4.5 12V12.5C4.49835 13.0299 4.28711 13.5377 3.91239 13.9124C3.53768 14.2871 3.02993 14.4984 2.5 14.5C2.36739 14.5 2.24021 14.4473 2.14645 14.3536C2.05268 14.2598 2 14.1326 2 14C2 13.8674 2.05268 13.7402 2.14645 13.6464C2.24021 13.5527 2.36739 13.5 2.5 13.5C2.76522 13.5 3.01957 13.3946 3.20711 13.2071C3.39464 13.0196 3.5 12.7652 3.5 12.5V12C3.50041 11.6637 3.58533 11.333 3.74697 11.0381C3.9086 10.7432 4.14175 10.4937 4.425 10.3125C3.98329 9.98855 3.6241 9.56511 3.37653 9.07648C3.12895 8.58785 2.99996 8.04777 3 7.5V7C3.00624 6.37892 3.17195 5.76987 3.48125 5.23125C3.32888 4.73791 3.28021 4.21839 3.33829 3.70534C3.39637 3.19228 3.55995 2.69679 3.81875 2.25C3.86149 2.17338 3.92411 2.10971 4.00001 2.06571C4.07591 2.02171 4.16227 1.99901 4.25 2C4.83243 1.99854 5.40711 2.13344 5.92805 2.39391C6.44899 2.65438 6.90172 3.03318 7.25 3.5H8.75C9.09828 3.03318 9.55101 2.65438 10.072 2.39391C10.5929 2.13344 11.1676 1.99854 11.75 2C11.8377 1.99901 11.9241 2.02171 12 2.06571C12.0759 2.10971 12.1385 2.17338 12.1812 2.25C12.44 2.69679 12.6036 3.19228 12.6617 3.70534C12.7198 4.21839 12.6711 4.73791 12.5188 5.23125C12.828 5.76987 12.9938 6.37892 13 7V7.5C13 8.04777 12.871 8.58785 12.6235 9.07648C12.3759 9.56511 12.0167 9.98855 11.575 10.3125C11.8582 10.4937 12.0914 10.7432 12.253 11.0381C12.4147 11.333 12.4996 11.6637 12.5 12V12.5C12.5 12.7652 12.6054 13.0196 12.7929 13.2071C12.9804 13.3946 13.2348 13.5 13.5 13.5C13.6326 13.5 13.7598 13.5527 13.8536 13.6464C13.9473 13.7402 14 13.8674 14 14Z"
        fill="#656167"
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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

export const CWPolkadot = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M8.00021 4.11689C9.33263 4.11689 10.4128 3.48868 10.4128 2.71375C10.4128 1.93882 9.33263 1.31061 8.00021 1.31061C6.66779 1.31061 5.58765 1.93882 5.58765 2.71375C5.58765 3.48868 6.66779 4.11689 8.00021 4.11689Z"
        fill="#656167"
      ></path>
      <path
        d="M8.00021 14.6893C9.33263 14.6893 10.4128 14.0611 10.4128 13.2862C10.4128 12.5112 9.33263 11.883 8.00021 11.883C6.66779 11.883 5.58765 12.5112 5.58765 13.2862C5.58765 14.0611 6.66779 14.6893 8.00021 14.6893Z"
        fill="#656167"
      ></path>
      <path
        d="M4.63816 6.05918C5.30438 4.9053 5.30005 3.65558 4.62851 3.26785C3.95696 2.88012 2.87249 3.50121 2.20628 4.65509C1.54007 5.80897 1.5444 7.05869 2.21594 7.44641C2.88749 7.83414 3.97195 7.21306 4.63816 6.05918Z"
        fill="#656167"
      ></path>
      <path
        d="M13.7931 11.3448C14.4593 10.1909 14.4554 8.94137 13.7843 8.5539C13.1132 8.16644 12.0291 8.78774 11.3629 9.94162C10.6967 11.0955 10.7006 12.345 11.3717 12.7325C12.0428 13.1199 13.1269 12.4986 13.7931 11.3448Z"
        fill="#656167"
      ></path>
      <path
        d="M4.62887 12.7321C5.30042 12.3444 5.30474 11.0947 4.63853 9.94081C3.97232 8.78693 2.88785 8.16584 2.21631 8.55357C1.54476 8.9413 1.54044 10.191 2.20665 11.3449C2.87286 12.4988 3.95733 13.1199 4.62887 12.7321Z"
        fill="#656167"
      ></path>
      <path
        d="M13.7849 7.44672C14.456 7.05925 14.46 5.80974 13.7937 4.65586C13.1275 3.50198 12.0434 2.88068 11.3723 3.26815C10.7013 3.65562 10.6973 4.90512 11.3635 6.059C12.0297 7.21288 13.1138 7.83418 13.7849 7.44672Z"
        fill="#656167"
      ></path>
    </svg>
  );
};

export const CWPolygon = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M11.5646 5.66283C11.3063 5.5104 10.9705 5.5104 10.6864 5.66283L8.67158 6.83142L7.30259 7.59356L5.28782 8.76212C5.02952 8.91456 4.69373 8.91456 4.4096 8.76212L2.80812 7.84759C2.54981 7.69515 2.369 7.4157 2.369 7.11087V5.30717C2.369 5.00232 2.52399 4.72288 2.80812 4.57045L4.38376 3.68131C4.64206 3.52889 4.97786 3.52889 5.26199 3.68131L6.83765 4.57045C7.09592 4.72288 7.27677 5.00232 7.27677 5.30717V6.47575L8.64576 5.68823V4.51964C8.64576 4.2148 8.49078 3.93535 8.20664 3.78293L5.28782 2.10625C5.02952 1.95383 4.69373 1.95383 4.4096 2.10625L1.43911 3.78293C1.15498 3.93535 1 4.2148 1 4.51964V7.89839C1 8.20322 1.15498 8.48267 1.43911 8.63511L4.4096 10.3118C4.6679 10.4642 5.00369 10.4642 5.28782 10.3118L7.30259 9.16859L8.67158 8.38108L10.6864 7.23789C10.9447 7.08545 11.2804 7.08545 11.5646 7.23789L13.1402 8.12704C13.3985 8.27944 13.5793 8.55889 13.5793 8.86376V10.6675C13.5793 10.9723 13.4243 11.2517 13.1402 11.4042L11.5646 12.3187C11.3063 12.4711 10.9705 12.4711 10.6864 12.3187L9.11069 11.4295C8.85238 11.2772 8.67158 10.9977 8.67158 10.6928V9.52427L7.30259 10.3118V11.4804C7.30259 11.7852 7.45757 12.0647 7.7417 12.2171L10.7122 13.8937C10.9705 14.0462 11.3063 14.0462 11.5904 13.8937L14.5609 12.2171C14.8192 12.0647 15 11.7852 15 11.4804V8.10162C15 7.79679 14.845 7.51734 14.5609 7.3649L11.5646 5.66283Z"
        fill="#656167"
      ></path>
    </svg>
  );
};

export const CWQuotes = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
      {...otherProps}
    >
      <path
        d="M6.62318 4.44434H3.95557V7.11195H6.62318V4.44434Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.77841"
      />
      <path
        d="M12.8453 4.44434H10.1777V7.11195H12.8453V4.44434Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.77841"
      />
      <path
        d="M6.62223 7.11133C6.62223 10.6944 3.95557 11.5558 3.95557 11.5558L6.62223 7.11133Z"
        fill="currentColor"
      />
      <path
        d="M6.62223 7.11133C6.62223 10.6944 3.95557 11.5558 3.95557 11.5558"
        stroke="currentColor"
        strokeWidth="1.77841"
      />
      <path
        d="M12.8444 7.11133C12.8444 10.6944 10.1777 11.5558 10.1777 11.5558L12.8444 7.11133Z"
        fill="currentColor"
      />
      <path
        d="M12.8444 7.11133C12.8444 10.6944 10.1777 11.5558 10.1777 11.5558"
        stroke="currentColor"
        strokeWidth="1.77841"
      />
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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

export const CWTrendUp = (props: IconProps) => {
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
        componentType,
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      fill="none"
      viewBox="0 0 17 16"
      {...otherProps}
    >
      <path
        d="M14.6599 3.5L8.65991 9.5L6.15991 7L1.65991 11.5"
        stroke="#7B9E3F"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M14.6599 7.5V3.5H10.6599"
        stroke="#7B9E3F"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType,
      )}
      {...otherProps}
    >
      <path
        d="M28.6387 9.45556C28.6581 9.73556 28.6581 10.0156 28.6581 10.2981C28.6581 18.9085 22.1032 28.8388 10.1174 28.8388V28.8336C6.57677 28.8388 3.10967 27.8246 0.129028 25.9123C0.643867 25.9743 1.16129 26.0052 1.68 26.0065C4.61419 26.0091 7.46451 25.0246 9.7729 23.2117C6.98451 23.1588 4.53935 21.3407 3.68516 18.6865C4.66193 18.8749 5.66838 18.8362 6.62709 18.5743C3.58709 17.9601 1.4 15.2891 1.4 12.1872C1.4 12.1588 1.4 12.1317 1.4 12.1046C2.3058 12.6091 3.32 12.8891 4.35742 12.9201C1.49419 11.0065 0.611609 7.19749 2.34064 4.21943C5.64903 8.29039 10.5303 10.7652 15.7703 11.0272C15.2452 8.76394 15.9626 6.39233 17.6555 4.80136C20.28 2.33426 24.4077 2.46072 26.8748 5.08394C28.3342 4.7962 29.7329 4.26072 31.0129 3.50201C30.5265 5.01039 29.5084 6.29169 28.1484 7.10588C29.44 6.95362 30.7019 6.60781 31.8903 6.08007C31.0155 7.39104 29.9135 8.53298 28.6387 9.45556Z"
        fill="#1D9BF0"
      />
    </svg>
  );
};

export const CWTwitterNew = (props: IconProps) => {
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
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={getClasses<IconStyleProps>(
        { className, disabled, iconButtonTheme, iconSize, selected },
        componentType,
      )}
      {...otherProps}
    >
      <path
        d="M15.3563 4.85625L13.4688 6.7375C13.0938 11.1062 9.40629 14.5 5.00004 14.5C4.09379 14.5 3.34379 14.3562 2.77504 14.075C2.31879 13.8437 2.13129 13.6 2.08129 13.525C2.03993 13.4622 2.01327 13.3908 2.00331 13.3162C1.99335 13.2417 2.00035 13.1658 2.02377 13.0943C2.0472 13.0228 2.08646 12.9576 2.13862 12.9034C2.19079 12.8491 2.25451 12.8074 2.32504 12.7812C2.33754 12.775 3.81254 12.2125 4.76879 11.1312C4.17576 10.709 3.65451 10.1941 3.22504 9.60625C2.36879 8.44375 1.46254 6.425 2.00629 3.4125C2.02339 3.32294 2.06435 3.23966 2.12486 3.17145C2.18536 3.10325 2.26316 3.05265 2.35004 3.025C2.4372 2.99646 2.53053 2.99244 2.61982 3.01339C2.70911 3.03433 2.79092 3.07943 2.85629 3.14375C2.87504 3.16875 4.95629 5.21875 7.50004 5.88125V5.5C7.5025 5.10357 7.58301 4.7115 7.73699 4.34619C7.89097 3.98088 8.1154 3.64947 8.39746 3.37089C8.67952 3.09232 9.01369 2.87202 9.38088 2.7226C9.74808 2.57317 10.1411 2.49753 10.5375 2.5C11.0578 2.50742 11.5674 2.64949 12.0164 2.91236C12.4655 3.17523 12.8388 3.54995 13.1 4H15C15.0988 3.99969 15.1954 4.02861 15.2777 4.08311C15.36 4.1376 15.4243 4.21525 15.4625 4.30625C15.4986 4.3986 15.5077 4.49927 15.4889 4.5966C15.4701 4.69393 15.4241 4.78395 15.3563 4.85625Z"
        fill="#656167"
      ></path>
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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
        componentType,
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

export const CWGoogle = (props: IconProps) => {
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
        componentType,
      )}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <rect width="32" height="32" fill="url(#patternCWGoogle)" />
      <defs>
        <pattern
          id="patternCWGoogle"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image0_81_78397" transform="scale(0.00195312)" />
        </pattern>
        <image
          id="image0_81_78397"
          width="512"
          height="512"
          xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAMQGlDQ1BJQ0MgUHJvZmlsZQAASImVVwdYU8kWnluSkEBooUsJvQkiNYCUEFroHUFUQhIglBgDQcWOLiq4drGADV0VUbACYkERxcKi2PtiQUVZFwt25U0K6LqvfG++b+78958z/zlz7sy9dwBQO8ERifJQdQDyhYXiuJAA+tiUVDrpKSAAMqAAFKhzuAUiZkxMBIBlqP17eXcdINL2ioNU65/9/7Vo8PgFXACQGIgzeAXcfIgPAoBXcUXiQgCIUt58SqFIimEFWmIYIMQLpThLjqukOEOO98psEuJYELcBoKTC4YizAFC9BHl6ETcLaqj2Q+wk5AmEAKjRIfbNz5/EgzgdYhtoI4JYqs/I+EEn62+aGcOaHE7WMJbPRVaUAgUFojzOtP8zHf+75OdJhnxYwaqSLQ6Nk84Z5u1m7qRwKVaBuE+YERUNsSbEHwQ8mT3EKCVbEpoot0cNuQUsmDOgA7ETjxMYDrEhxMHCvKgIBZ+RKQhmQwxXCDpVUMhOgFgP4oX8gqB4hc1m8aQ4hS+0IVPMYir4sxyxzK/U131JbiJTof86m89W6GOqxdkJyRBTILYoEiRFQawKsWNBbny4wmZMcTYrashGLImTxm8BcRxfGBIg18eKMsXBcQr7svyCoflim7MF7CgF3l+YnRAqzw/WxuXI4odzwS7xhczEIR1+wdiIobnw+IFB8rljz/jCxHiFzgdRYUCcfCxOEeXFKOxxM35eiJQ3g9i1oCheMRZPKoQLUq6PZ4oKYxLkceLFOZywGHk8+DIQAVggENCBBNYMMAnkAEFnX2MfvJP3BAMOEIMswAcOCmZoRLKsRwiv8aAY/AkRHxQMjwuQ9fJBEeS/DrPyqwPIlPUWyUbkgicQ54NwkAfvJbJRwmFvSeAxZAT/8M6BlQvjzYNV2v/v+SH2O8OETISCkQx5pKsNWRKDiIHEUGIw0RY3wH1xbzwCXv1hdcYZuOfQPL7bE54QuggPCdcI3YRbEwUl4p+ijATdUD9YkYuMH3OBW0FNNzwA94HqUBnXwQ2AA+4K/TBxP+jZDbIsRdzSrNB/0v7bDH54Ggo7shMZJeuS/ck2P49UtVN1G1aR5vrH/MhjzRjON2u452f/rB+yz4Nt+M+W2ELsANaOncTOYUexRkDHWrAmrAM7JsXDq+uxbHUNeYuTxZMLdQT/8Df0ZKWZLHCqdep1+iLvK+RPlb6jAWuSaJpYkJVdSGfCLwKfzhZyHUfSnZ2cXQCQfl/kr683sbLvBqLT8Z2b9wcAPi2Dg4NHvnNhLQDs84Db//B3zoYBPx3KAJw9zJWIi+QcLr0Q4FtCDe40fWAMzIENnI8zcAfewB8EgTAQDRJACpgAo8+G61wMpoAZYC4oBeVgGVgN1oNNYCvYCfaA/aARHAUnwRlwAVwC18AduHp6wAvQD96BzwiCkBAqQkP0ERPEErFHnBEG4osEIRFIHJKCpCNZiBCRIDOQeUg5sgJZj2xBapB9yGHkJHIO6UJuIQ+QXuQ18gnFUBVUCzVCrdBRKANlouFoAjoezUIno8XofHQJuhatRnejDehJ9AJ6De1GX6ADGMCUMR3MFHPAGBgLi8ZSsUxMjM3CyrAKrBqrw5rhc76CdWN92EeciNNwOu4AV3Aonohz8cn4LHwxvh7fiTfgbfgV/AHej38jUAmGBHuCF4FNGEvIIkwhlBIqCNsJhwin4V7qIbwjEok6RGuiB9yLKcQc4nTiYuIGYj3xBLGL+Ig4QCKR9En2JB9SNIlDKiSVktaRdpNaSJdJPaQPSspKJkrOSsFKqUpCpRKlCqVdSseVLis9VfpMVidbkr3I0WQeeRp5KXkbuZl8kdxD/kzRoFhTfCgJlBzKXMpaSh3lNOUu5Y2ysrKZsqdyrLJAeY7yWuW9ymeVHyh/VNFUsVNhqaSpSFSWqOxQOaFyS+UNlUq1ovpTU6mF1CXUGuop6n3qB1WaqqMqW5WnOlu1UrVB9bLqSzWymqUaU22CWrFahdoBtYtqfepkdSt1ljpHfZZ6pfph9RvqAxo0jdEa0Rr5Gos1dmmc03imSdK00gzS5GnO19yqeUrzEQ2jmdNYNC5tHm0b7TStR4uoZa3F1srRKtfao9Wp1a+tqe2qnaQ9VbtS+5h2tw6mY6XD1snTWaqzX+e6ziddI12mLl93kW6d7mXd93oj9Pz1+HplevV61/Q+6dP1g/Rz9ZfrN+rfM8AN7AxiDaYYbDQ4bdA3QmuE9wjuiLIR+0fcNkQN7QzjDKcbbjXsMBwwMjYKMRIZrTM6ZdRnrGPsb5xjvMr4uHGvCc3E10RgssqkxeQ5XZvOpOfR19Lb6P2mhqahphLTLaadpp/NrM0SzUrM6s3umVPMGeaZ5qvMW837LUwsIi1mWNRa3LYkWzIssy3XWLZbvreytkq2WmDVaPXMWs+abV1sXWt914Zq42cz2aba5qot0ZZhm2u7wfaSHWrnZpdtV2l30R61d7cX2G+w7xpJGOk5UjiyeuQNBxUHpkORQ63DA0cdxwjHEsdGx5ejLEaljlo+qn3UNyc3pzynbU53RmuODhtdMrp59GtnO2euc6XzVReqS7DLbJcml1eu9q58142uN91obpFuC9xa3b66e7iL3evcez0sPNI9qjxuMLQYMYzFjLOeBM8Az9meRz0/erl7FXrt9/rL28E713uX97Mx1mP4Y7aNeeRj5sPx2eLT7Uv3Tffd7NvtZ+rH8av2e+hv7s/z3+7/lGnLzGHuZr4McAoQBxwKeM/yYs1knQjEAkMCywI7gzSDEoPWB90PNgvOCq4N7g9xC5keciKUEBoeujz0BtuIzWXXsPvDPMJmhrWFq4THh68PfxhhFyGOaI5EI8MiV0bejbKMEkY1RoNodvTK6Hsx1jGTY47EEmNjYitjn8SNjpsR1x5Pi58Yvyv+XUJAwtKEO4k2iZLE1iS1pLSkmqT3yYHJK5K7x44aO3PshRSDFEFKUyopNSl1e+rAuKBxq8f1pLmllaZdH289fur4cxMMJuRNODZRbSJn4oF0Qnpy+q70L5xoTjVnIIOdUZXRz2Vx13Bf8Px5q3i9fB/+Cv7TTJ/MFZnPsnyyVmb1ZvtlV2T3CViC9YJXOaE5m3Le50bn7sgdzEvOq89Xyk/PPyzUFOYK2yYZT5o6qUtkLyoVdU/2mrx6cr84XLy9ACkYX9BUqAV/5DskNpJfJA+KfIsqiz5MSZpyYKrGVOHUjml20xZNe1ocXPzbdHw6d3rrDNMZc2c8mMmcuWUWMitjVuts89nzZ/fMCZmzcy5lbu7c30ucSlaUvJ2XPK95vtH8OfMf/RLyS22paqm49MYC7wWbFuILBQs7F7ksWrfoWxmv7Hy5U3lF+ZfF3MXnfx3969pfB5dkLulc6r504zLiMuGy68v9lu9cobGieMWjlZErG1bRV5Wtert64upzFa4Vm9ZQ1kjWdK+NWNu0zmLdsnVf1mevv1YZUFlfZVi1qOr9Bt6Gyxv9N9ZtMtpUvunTZsHmm1tCtjRUW1VXbCVuLdr6ZFvStvbfGL/VbDfYXr796w7hju6dcTvbajxqanYZ7lpai9ZKant3p+2+tCdwT1OdQ92Wep368r1gr2Tv833p+67vD9/feoBxoO6g5cGqQ7RDZQ1Iw7SG/sbsxu6mlKauw2GHW5u9mw8dcTyy46jp0cpj2seWHqccn398sKW4ZeCE6ETfyayTj1ontt45NfbU1bbYts7T4afPngk+c6qd2d5y1ufs0XNe5w6fZ5xvvOB+oaHDrePQ726/H+p072y46HGx6ZLnpeauMV3HL/tdPnkl8MqZq+yrF65FXeu6nnj95o20G903eTef3cq79ep20e3Pd+bcJdwtu6d+r+K+4f3qP2z/qO927z72IPBBx8P4h3cecR+9eFzw+EvP/CfUJxVPTZ7WPHN+drQ3uPfS83HPe16IXnzuK/1T48+qlzYvD/7l/1dH/9j+nlfiV4OvF7/Rf7Pjrevb1oGYgfvv8t99fl/2Qf/Dzo+Mj+2fkj89/TzlC+nL2q+2X5u/hX+7O5g/OCjiiDmyXwEMVjQzE4DXOwCgpgBAg+czyjj5+U9WEPmZVYbAf8LyM6KsuANQB//fY/vg380NAPZug8cvqK+WBkAMFYAET4C6uAzXobOa7FwpLUR4Dtgc+zUjPwP8myI/c/4Q988tkKq6gp/bfwEEeHw1JDMf9wAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAACAKADAAQAAAABAAACAAAAAAAoMJe/AABAAElEQVR4AeydCXxU1dn/n3NnJnsAWRJErGDdsSokgIhLAPcqKhBEtHVrXbpYX2u1otbUql1s1ba+b7V7rQoEkbr8XYFExCpLwKVqVRRXlrAHss3MPef/XAplS8jMnbuce+9vPh/IzL3nPMv3ucl55qxEeIEACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACOhCQOhiCOwAARBwlsCakSNLqaillNKxUlJGaZpkiUFGj61ahIwJJUq3a1SCipRQeds/7/yTy7UIRUnrmjRUu5BGKxmiRUozGSdjC0tKSlM0FVDbxh71r2/iPypq5/p4DwIgoCcBJAB6xgVWgcAuBJZXVRUUGZv3UzLeh4RZLkiUKyX6cKG+hlDWz3ISyrpmNerWv+78z6/XZla8if81EYn1nA+s5p9r+Y/NOuu95PckaFVMyS/MRPLzvi+82eyXodALAlEmgAQgytGH79oQaKwaVCKpcACRMUAI9SVuMPm94n+C31s/uYEP76uJuwxWcC/DZ+z7p1KIj0mJj/j9x0ZKLu/zcsPK8LoOz0DAPwJIAPxjD80RJLCuanj/lJCHGkIcoZQ6VCh1hBLiUEbRL4I4MnW5jXsMPuCBhfc5SXhXGep9ThL+nS/k+z1nN1g9DXiBAAjYIIAEwAY0VAGBrghY4+8yr/0o7qqvkETHcPmv8C+b1dD/d9y9Kxm4nxGBTxWpt7jH4C0S/E/JN8s3q/dEQ0Mqo9ooBAIRJoAEIMLBh+vOEPjstBE989rTQ3gMfrDV4HN3ttXgH8L/8PvlDOJspSQ5Bm9yLBqUokUiJhaVmYXviPr6dLaCUB4EwkwAf6DCHF345jgBbljEuqqKQ9MUG8kN/kj+BRrJSqzGHi+9CbTxEMJSNvEVTsteJcN4pXzOAp6ciBcIRJcAEoDoxh6eZ0DAmn1fHGsZSkpZDf1I/kY5gn/2yqAqiuhP4EPO5/7JMZ1nULq+rH7JMv1NhoUg4BwBJADOsYSkEBBQNWSsmVt5tIrRyTyufAp/Wzye3SoMgWtwoWsCX/CKizm870Fd2kjX9Zu79JOuq6AECASXABKA4MYOljtEYGXVsQMEyZO5S/8U/oUYzWJ7OyQaYoJN4H2eYPi8QfRcukTV93uqoSXY7sB6ENiVABKAXXngUwQIqOrq2Nq1Hx8vBZ3N48Jns8sYw49A3HN0sZ3rz+fdEp8WhniyfPaij3KUh+og4DsBJAC+hwAGeEFg3RnDu5nt6jT+RjeWG/2vss59vNALHaEl8A5PCH2Ck4Gnyk5YuEDUEK/2xAsEgkUACUCw4gVrsyCweszwcqHMaiXFWB7Lr+KqiSyqoygIZErA2qnwcU4IZpX3HlAvZswwM62IciDgJwEkAH7Sh27HCfxnTX6qmjeFmcjCq/gfD+HiBQKeEVjDKws4GVAzkAx4xhyKbBJAAmATHKrpQ2D9yRXd0+nYuTw+ewFbNYb/xfWxDpZEmMBK7nl6VKTVI2XzFlt7EOAFAloRQAKgVThgTKYEVEVForE09lWeuX8p1zmd/+VlWhflQMBrAnyw0bu8rPTv6Zh8pN/shk+91g99INARASQAHVHBNW0JrKqqPFII4zJer30hG1mmraEwDAQ6JsBTBdSLvE3xnzYVbHji4GeXWasL8AIBXwggAfAFO5RmQ2BD1TE9kiIxmf9yXsoPbGU2dVEWBDQmsI6f6UfIlH/sO6/hLY3thGkhJYAEIKSBDYNbjVUVxysR+xZ/YxrH/uSHwSf4AAIdExDzORn43brezY8NmvF2suMyuAoCzhJAAuAsT0jLkcCKsyuKjGbjQj73/dss6ugcxaE6CASNwBpOBP4oRfpBbEUctNAFz14kAMGLWSgtbqwachBR7NtK0CXsYI9QOgmnQCBzAtZeAv/g3q97y+sWv5J5NZQEgcwJIAHInBVKOkyAv+mINaMrT1dKfI9Fn8r/8Dw6zBjiQkFgIS9xva9clswQ9fXpUHgEJ7QggD+4WoQhWka8XT0or/fa4kn87eYH7PmR0fIe3oKAbQKf8wZD9xiq9Q9l9W9vsS0FFUFgGwEkAHgUPCOwZuTIUplIXsHf869lpf09UwxFIBAuAut4p8v7TWne36++YW24XIM3XhJAAuAl7YjqWnNCxb5mzLhGCLqaEXSPKAa4DQJOE2jmybJ/EKb8RZ+XG6zzCPACgawIIAHIChcKZ0NgxckVX4qZsSnc1X8p18NOfdnAQ1kQyJxAGyfXD4qU/DkSgcyhoSQmXeEZcIHATg0/79iHE/hcQAyRINARASQCHVHBtU4JoAegUzS4kS2BdVXD+6eFuoW/8aPhzxYeyoOAcwTaSNH9qZj4Wf85C9c5JxaSwkYACUDYIuqDP9YYv0oYNypFV7L6Ah9MgEoQAIE9CWzifTV+aciW+7BqYE84uIIhADwDORD4zx798Zv4MbqGxaDhz4ElqoKAiwRWCyHu7LPJfEA0NKRc1APRASOAHoCABUwHc7et4/8Od/XfzPb01MEm2AACINAlgfd5H4Eb+tYtfqLLkigQCQJIACIRZmectHbua6waOpnX8d/BEgc4IxVSQAAEvCTAf/TrhZDf7zO3YYmXeqFLPwJIAPSLiZYWrRo1dAw/LL9g44ZoaSCMAgEQyIYA5/P0EBnGjeVzFqzOpiLKhocAEoDwxNIVT1aPrviykMa9PJnobFcUQCgIgICfBJq4Y+/HZaroNzhnwM8w+KMbCYA/3LXXah3LG28WU/ignuvZ2HztDYaBIAACtgkIod6VSny3b92iObaFoGLgCCABCFzI3De4cfSwalLqV9xHuL/72qABBEBAFwL8O18bS8trsaOgLhFx1w4kAO7yDZT0VVWVRxpEv1FCjAqU4TAWBEDASQI8LEA3lZ206AFRQ9JJwZClFwEkAHrFwxdrVp16VLFI5d3OY4HfYwNivhgBpSAAApoREAvYoCvL6xa+oZlhMMchAkgAHAIZVDG8rO90/sb/AK/pPyCoPsBuEAAB1wiYgsTPm1XRTwbW17e5pgWCfSGABMAX7P4rXXnC4D5GPH4fWzLZf2tgAQiAgOYE3lPKuKRv/YLXNLcT5mVBAAlAFrDCUrSxatjFSqh72B/s4heWoMIPEHCfAHcW0m/SxXJKv6caWtxXBw1uE0AC4DZhjeSvOnHYQBFTv2eTTtbILJgCAiAQKAJiGQl1cfncRf8MlNkwdg8CSAD2QBK+C7y0RzSOHnoVHxF6N3tXHD4P4REIgIDHBCSf/vmLdX1abhs04+2kx7qhziECSAAcAqmrmLWjR+xnqvSf2L7TdLURdoEACASWwBvKlF/rO6/hrcB6EGHDedk3XmElsGrUsMnc+Fu/mGj8wxpk+AUC/hI4WsSMxatHDbvO6mn01xRoz5YAApYtsQCU/3zMsF4JqX7HplYHwFyYCAIgEA4Cz/PhQhfjcKHgBBMJQHBilZGljaMqz1Qk/syFyzOqgEIgAAIg4ByBRqHo4rL6Rc85JxKS3CKABMAtsh7Lfbt6UF7vtYU/5V646zxWDXUgAAIgsCsBQb8q2yRvEg0NqV1v4JNOBJAA6BQNm7ZYR/byJh3TOJiVNkWgGgiAAAg4TeA1MybP7ze74VOnBUOeMwQwCdAZjr5J4QN8JpEylqDx9y0EUAwCINAxgWNjprGkcXTlGR3fxlW/CaAHwO8I2NT/2YgRhfmF6d/wWtxv2BSBaiAAAiDgCQFeIfDT8t4DbhUzZpieKISSjAggAcgIk16FVo4ZfoQhZS1bNUgvy2ANCIAACHRKYHbKEJP6z1m4rtMSuOEpASQAnuLOXVljVeUE3pD7rywJO/rljhMSQAAEPCUgPhGmPK9s3uKlnqqFsg4JIAHoEIt+F1V1daxx7fK7eJb/DfpZB4tAAARAIGMCbXyWwBXlcxf/PeMaKOgKASQArmB1Vui2jX2ms9QxzkqGNBAAARDwhwDvF3Bfnz4Drse8AH/4W1qRAPjHPiPNa0YNr5CkZhKpAzKqgEIgAAIgEBwCzyViclLP2Q2bgmNyeCzFMkCNY9lYNexiSXI+Gn+NgwTTQAAEciFwetI0Xms8cfjBuQhBXXsE0ANgj5urtbaN9/8Cu/q5ihnCQQAE9CGwQRrG+H3nLKjTx6TwW4IEQLMYrztjeLdUm5oqSJ2pmWkwBwRAAATcJJASSnyzrH7h39xUAtk7CCAB2MHC93erThw2UMTU02zIEb4bAwNAAARAwB8Ct5fVLarhxon3D8LLTQJIANykm4XsVVXDjxVCPslV+mRRDUVBAARAIIQE1ENre7d+c9CMt5MhdE4bl5AAaBCKbZv7PMSmFGpgDkwAARAAAR0IzOEVAuOxQsC9UGAVgHtsM5K8umro93lnP2tbXzT+GRFDIRAAgYgQGJMyjfrVY4aXR8Rfz91ED4DnyP+jkAe3xJqqofcoQdf6ZALUggAIgEAQCHwklHlaWf2SZUEwNkg2IgHwIVpvVw/K67226GFWXe2DeqgEARAAgaARWGMIeXqfuQ1Lgma4zvbGdTYujLatP7mie2qt8Tj7NjqM/sEnEAABEHCBQL6pKOGC3EiLRA+Ah+FfecLgPiIef4ahV3qoFqpAAARAIMgEmhTJU/vWNSwIshM62o4EwKOorKsa3j8t5GxWd6hHKqEGBEAABIJOAI2/ixFEAuAi3O2iG6uGHKRErJ4/77f9Gn6CAAiAAAjslQAa/73iyf0mlgHmznCvEladWPEVbvxf5kJo/PdKCjdBAARA4L8E0Pj/F4V7b2LuiYbkNaMrhpAwrG7/MtAAARAAARDIiAAa/4ww5V4ICUDuDDuUsGpUxXAiYw7f3KfDArgIAiAAAiCwOwE0/rsTcfEz5gC4ANdq/AUZL7Dobi6Ih0gQAAEQCCMBNP4eRxUJgMPA0fg7DBTiQAAEokAAjb8PUUYC4CB0NP4OwoQoEACBqBBYq0w5uu+8hrei4rAufiIBcCgSaPwdAgkxIAACUSKAxt/HaCMBcAC+tdRPxIx6FtXTAXEQAQIgAAJRIIDG3+coYxVAjgFYOWb4EYagehbTK0dRqA4CIAACUSGAxl+DSKMHIIcgrD556IFk0jwWgU1+cuCIqiAAApEigMZfk3BjJ0CbgbD29ufG31rqh8bfJkNUAwEQiBwBNP4ahRxDADaC8dlpI3oKaVo7/B1mozqqgAAIgEAUCaDx1yzq6AHIMiArzq4oymtPP83VjsyyKoqDAAiAQFQJoPHXMPJIALIIiqqqihtbYjNI0IgsqqEoCIAACESZABp/TaMf19Qu7cxSRKJRNP+RZ02eqZ1xMAgEQAAE9CSAxl/PuGy1Cj0AGQancdTQH3PRizMsjmIgAAIgEHUCq7DDn96PAJYBZhCfVVXDLhdC/TGDoigCAiAAAiBA9IVQZlVZ/ZJlgKEvASQAXcSmsWro6UqQNekPKya6YIXbIAACIMAE0PgH5DFAArCXQK2qqjxSCPFPLlK6l2K4BQIgAAIg8B8CaPwD9CTgW20nwVo9Zng5Z0f1fLuskyK4DAIgAAIgsIMAGv8dLALxDpMAOwjTZyNGFJKUT/KtL3VwG5dAAARAAAR2JYDGf1cegfiEBGC3MFnL/fIKzD/x5WG73cJHEAABEACBPQmg8d+TSSCuIAHYLUxrRg+9kUhdsNtlfAQBEAABENiTABr/PZkE5gomAe4UKl7udxYv93uCLyEx2okL3oIACIBABwTQ+HcAJUiXkABsi9baqorDTGEs5I+Y8R+kJxi2ggAI+EEAjb8f1B3WiW+6DHTNyJGl0hCP81s0/g4/YBAHAiAQOgJo/EMS0sgnANakP5lI/k0pcXhIYgo3QAAEQMAtAh9ihz+30HovN/KHAa0ZNfSHjP0879FDIwiAAAgEisCHcWVU9apf9HmgrIaxnRKI9ByAlVWVVYYQc5hO5HtCOn1CcAMEQAAEiLY1/gvQ+IfoaYhsAsB7/PflPf5f51iWhyiecAUEOiPQzjc28JDXRv6l38jv+Z/ga8p6z2+Jfx1o09b3O/4rVooS2z6WcKE4KVXEBffhsvvw9R78z/qJBHobpJD+QOMf0sBGcghAVVfHGtd+PJ1jisY/pA92xNyyGvH3haCPeC7LZ0rIFYYSK5QhPjNVakW77L56YH19m1tM1p0xvFuqWfUiQ5QbhtpfKtmfE4T+ioT109pN0/rXzy39kOsqATT+ruL1Vzj/fkbvtXrU0NvZ61uj5zk8DjiBldyoLuVv4W8aJP7NDf2ylGH8u/+chet098taaUOJ1KFS0BH8R+dQpdTh3OtwKNtt/cOZJHoGEI2/nnFxzKrIJQCNY4adoKSqZ4LotnTsMYIgFwisZJnz+Vv9Ev5Wv1Ql4kv7vvDPRhf0+CrSOncjrzA9WCiq5KGFoaT4H9Eh/C9yf5t8DcSeytH478kkdFci9Uv22WkjeuYl029wFPuHLpJwKOgE3uY2bz4vSn1FpY35fectXB50h+zav3VfjkRyuDBUFSc/VSxnOP+L5HClXYY51kPjnyPAoFSPVALAXf8zOTDjghIc2BlqAqu5wX+Bu/NfUHmJF8L47d6p6DVWDeIJiEXHK4M4IaAx/EergmVH6m+XUywzkIPGPwNIYSkSmV8ibvyv4KA9GJbAwY/AEbD2nFrIXd2zuKv7ubK6hW/yLx9fwytbAtYKHmnQ2Zw8nSNIjOH6BdnKQPkOCaDx7xBLeC9GIgFYceKxh8diZgOHsTC8oYRnGhIw2aaXhFKPi4Q5q8+LS1doaGOgTVpxdkVRbHPsVDLUOZxOncfOdA+0Q/4Zj8bfP/a+aQ59AvDBGQfld2vrwYf8iKN8owzFESMg5iuhHkol4jP3f/7V9RFz3jd3//O7vs9XSaiv8a4GZ7Iheb4ZEyzF/zLS8tQ+LzdYE0/xihCB0CcAq6uG3s2jhddHKKZw1Q8Cgj7gb6B/V6Z4OMoT+PxA35HOjccfv097vG0iCeMiHmk5vqMyuLaVwL9kOj1635eXrgGP6BEIdQKwqmr4sYJnVXNYseQves+2Fx5bO+lZG0r9vrxusfWc4aUhAWsI0Iilr+b5ApeweTjxc0eM0PjvYBHJd6FNAJZXVRUUiebXOarWRiN4gYCTBD7kb/u/S+bH/4IufiexuivLWk2gqPBC7hH8FoYECY2/u49bIKSHNgFYParyV/xLfl0gogAjg0FA0bMkxK95Bv8L/IuDGfzBiFqHVv5nQzD6PofxnA4LhPsiGv9wxzdj70KZAGzb7e8lphBK/zKOLgo6QSDFj9E0ZZp3953X8JYTAiFDHwIrxww/wpByCls0if9FYUtiNP76PH6+WxK6BnLrsqAtMd7tTx3kO10YEGQCzZw+PhCXxn296nEEapADmYntq04cNlAY8gbu4bmEy4d1XwE0/pk8DBEqE7oEoHH00Pt4t7DvRSiGcNVZAlbDf78p5S/71TesdVY0pOlOYM0JFfvKuGEdFGZtHBamHgE0/ro/fD7YF6oEYPXoocfxyOx85hgqv3x4LqKoko/LFb81lfkLNPxRDP+uPjdWDTlIidhdfLV61zuB/ITGP5Bhc9/o0DSUqqoq3mg0L+EE4CvuY4OGEBFI84EzD8RM8y5shBKiqDrkyppRwyskyZ+zOGvL4SC+0PgHMWoe2RyaBGD1qGE38Li/9YuKFwhkRkCofxjCuLHPnIXvZ1YBpaJKgM8fOF0J8duAzS1C4x/VBzZDv0ORAKwYPfiAmIq/wz4XZeg3ikWbQIMQdF3Z3EXzoo0B3mdDwNpquLS15/VCqJu5nu7niixMxOSpPWc3bMrGR5SNFoFQJACrRlU+zbt8fTVaoYO3Ngis4dP4buhTv+hv/OBjHb8NgKhCtPULh4zfyzONrMOHdHyh8dcxKhraFPgEgDf8Gc+Ttx7TkC1M0oeA4qNjH8xPF0zpMX/+Bn3MgiVBJtA4uvIMnj/yf+zDAI38QOOvUTB0NyXQCcC6M4Z3S7dJq+t/P91Bwz7fCDTw2fFX7ztn0SLfLIDi0BKwtheWovAu7oH8Djvp999TNP6hfdLccSzQh+Sk21QNY0Hj786zEXSprXwk7/+UnbRoGBr/oIdSX/vL6t/e0rdu8TXCECexlR/6aCkafx/hB1W13xmrbW7WCV+xmGltzRqmzTps80DFnQmI+cIUl5XNW/DBzlfxHgTcJLD1sCFR/EueXnKlm3o6kI3GvwMouNQ1gcD2AHDjfw+7h8a/6xhHqUQzz9D+btlJC09C4x+lsOvhq9UbUF638CqDxFls0VqPrELj7xHoMKoJZA/Atsk3z4QxIPDJJgFFr1KcLiqfvegjmxJQDQQcI7DmlMH9ZDr+NxZ4smNC9xSExn9PJriSBYHA9QBYO/5JJaxv/3iBgEVA8r+flFHxiWj88UDoQqDPi0tX8PyT05Qg61wB6xl1+oXG32miEZQXuB6AVaMrrxVK3BvBWMHlPQl8ypOvLiqbs/DlPW/hCgjoQWDVqKFj+A/tI2xNuUMWofF3CGTUxQQqAfh8zLBeCamWcdB6RD1w8J9m5qfyv4l1/XgSgkBg7egR+5kq/TjbOixHe//JO/ydiR3+cqSI6lsJBGoIgBv/29lqNP7RfnhNXm79/bK6RdVo/KP9IATJ+95zX/2iqWDDiYrEn+3aLZSqM0vkKWj87RJEvd0JBKYHYM2YYYdIqaxNfzDzf/coRufzat7DfyL28I9OwMPoaePoYd9VSt3HvmX8Bcxq/NOl6qx+TzW0hJEJfPKHQMYPoD/m7dBqSvUT/oTGfweSiL0T8420HIzGP2JhD6G7ZXMX/paXq1pLBZsycQ+NfyaUUMYOgUD0ADSeWDlYxcQSOw6iThgIiAfLmszvioaGVBi8gQ8gYBFYOWroIP5G8yyfSrV/Z0TQ+HdGBtedIBCIHgBu/H/qhLOQETgCUim61tpcBY1/4GIHg7sgsG/dorcNER/Bxd7oqCga/46o4JqTBLTvAVgzauhJvIi23kmnISsQBDYLUpPK6hZjw6dAhAtG2iWw/uSK7um0mKWEGLVdBhr/7STw000C2vcASEX49u/mE6ClbPEJJ30j0PhrGRwY5TABa1b/mj6tp5OiWZZoNP4OA4a4Tglo3QOwavTQs4WiJzu1HjdCSEC9acTNM6yd1ELoHFwCgU4JqOrqWOPa5deZJep/Mdu/U0y44SABbRMAPujXWPNa5buqXRzioL8QpTeBebzJyVisc9Y7SLAOBEAgHAS0HQJIjiw8r/S8dYcYhW5sox2O4IXKC+7+bFHFp6HxD1VU4QwIgIDGBLRcV88zv4X8KPaIsc+WvvlHpMhcUUJys7a5isbhDYZpvLnPH8t6D7h4n2eewTK/YIQMVoIACISAgJZDAOnZ+WfxiX9Pbeer0glqmzOA2hoKtl/Cz7AQUOqBsvrF3+IHkZdD4wUCIAACIOAVAS2/VnPjf8vOAEQ8RYWnfUAlYzeRiKOd2JlNsN+Lu9H4BzuCsB4EQCC4BLTrAUi9kH8qr4d9vjOkZmNPap7Vl8x1Wo5edGY2ru9OQNDPy+cu+uHul/EZBEAABEDAGwLa9QBw4z9lb67HytZT6cUfU/7hyb0Vwz2dCaDx1zk6sA0EQCAiBLTqAUi9WHi8IvVypuzbFw6klrnFRFIrNzI1P6LlxL28te91EXUeboMACICANgR06wG4Phsy+cOWU7cL15BRiqWC2XDzsezvy+oWft9H/VANAiAAAiCwjYA2CUDb7PxD+Nv/2GwjE9t/NZVe+hklBqSzrYry3hJ4lJf6Yba/t8yhDQRAAAQ6JaBNAmAo41q20lZfvlHSRCXnv0+Fx7Z06ihu+EeA1/k/XdYkLxEzZpj+WQHNIAACIAACOxPQYiq9qivtLaX5NzYssbNxWb03FMUHbqBEeYJSH/J+AaatXCIrlSicAQFFr5olcmy3+ob2DEqjCAiAAAiAgEcEtOgBSKdTV7G/hU74HD/kC+p22QqKl2FegBM8c5MhlkkzfQ4ONsmNImqDAAiAgBsEfO8BUM9QvhmLT2XnSpxyUBS2Uv6Rm4m2lFB6ddwpsZCTHYG1vKFzVd+XlnyeXTWUBgEQAAEQ8IKA7z0AqbyCSexouePO5rVR4VnvU8mZTUQx7B7oON+9C2xVJM8qn9vw4d6L4S4IgAAIgIBfBHxPAEjSt9x0PnHMJ9T966so1h3zz9zkvLNsIcTFfesaFux8De9BAARAAAT0IuDrTLnk80UVZMjFXiBRrcXU8tT+lFxmf56hF3aGQMdPyusW/SgEfsAFEAABEAg1AX97AAz5ba/oisJmKp7ASwVP2uKVyijqebKsbtFtUXQcPoMACIBA0Aj4NglQPdetpzTMPzMw776SC14q+KWNlOgfozQvFVRpXztAgvasdGXv20Yy76vFn32G5X5dkcJ9EAABENCAgG89AKlY6mL235Glf9lyjA9cSd0u/4Li/TEvIFt2nZTfyDP+z+nzyiu89AIvEAABEACBIBDwpQdAKW4uPoo/xIB6+gVJ5LdR3qCNRO3FlF7hXSeEX/66qleIyeVzF//TVR0QDgIgAAIg4CgBX3oA0rMLTmIvDnLUExvCRDxFhacuo5Jz+AtsAksFbSAk3ub31+VzF86yUxd1QAAEQAAE/CPgSwLATe1l/rm8p+bEoM+o2yU8JNALQwJ70tnrldfW9Gq5Ya8lcBMEQAAEQEBLAp7PguOd/7qlEgUrmUaRdkTaC6nl2S9R+zt52pmmoUEbzJg8pt/shk81tA0mgQAIgAAIdEHA8x6AVLxgItukX+NvgcpvpaJz36PiU3ipIB8uhNdeCXwDjf9e+eAmCIAACGhNwPMEgA/81ar7v6Po5A1dTt0uXENGKQ4U6ogPX/sbb/bzeCf3cBkEQAAEQCAABDxNANrm5h/KTEYEgAvF9l/Npwp+SomB6SCY66WNH8cLjGu8VAhdIAACIAACzhPwNAEQUlzqvAvuSRTFm6lkIu8eeFyLe0qCJVkKQ3y917ML+IQlvEAABEAABIJMwLMEwFr7zxvxTQ4crJhJBVUfUumE9SQKoj4vQP2ybM7ClwMXQxgMAiAAAiCwBwHPEoD0i4XHsfb997AgIBfih3xB3S5dQfHyyM4LeK9FldwWkHDBTBAAARAAgS4IeJYAKIMu6MIW7W8b+6yn0q9/QPlHR2+7e+76/+bA+vo27YMEA0EABEAABDIi4Mk+AKqWYql9tq7975ORVQEolHrjAGp+vjQaBwop9UB5/eKrAxAWmAgCIAACIJAhAU96ANL75J/M9oSm8bfYJo7+hLp9fSXFeoR+98Av4oWxGzN8nlAMBEAABEAgIAQ8SQB4/t/5AeGRlZlG33VUeuknlHdwKqt6QSqsSH0bs/6DFDHYCgIgAAKZEXB9CIC3/s3nrX8b2ZxumZkUwFLSoPbXBlLLPD7dWLqO1EtAz/GGP2d4qRC6QAAEQAAEvCHgeg9AOi9/FLsS3sbfipMhKf84Xio4aS0ZRaFZJZAUJjb88ebXEFpAAARAwHsCricASopzvXfLH43xAat490A+VbB/COYFCLq3bN6CD/whCa0gAAIgAAJuE3A1AVA1fKSOoHPcdkIn+aLbRiqZ/AEVDGvVyaxsbVmh4u0/ybYSyoMACIAACASHgKsJQPqEwmN5RLxvcHA4Y6mIp6jw5GVUct4GEokA7h6o6Ia+L7zZ7AwNSAEBEAABENCRgKsJgJQyMt3/HQU3cfjn/xkS6B2oIYElZfWLHu3IH1wDARAAARAIDwFXEwBB4rzwoLLnidFrA5VevJzyByXtCfC6lqIbudcmgN0WXoOCPhAAARAINgHX1qy1v5h3uCDjnWDjcdb65OIB1DynhMh0DXtuBit6sbx+0am5CUFtEAABEACBIBBwrQfAEDGsH9/tCcir/Ji6XbSajG5aLhXk+Zp0w24m4yMIgAAIgEBICbiWACilzgwps5zciu23hk8V/JQSA9M5yXG6Mjf+tTz2/7rTciEPBEAABEBATwKuJADqKSpid0/Q02X/rRLFm6nk/PeoaKQ2E+2VaRi3+08GFoAACIAACHhFwJUEwCzMH80O5HnlRCD1WLsHnvQRlVavI6PQ3yEB69v/vnMWYL5GIB8kGA0CIAAC9gi4kgBIMk63Z070asUPXsFDAisosa9vSwXx7T96jx08BgEQAAFyJQEgjP9n9WiJHhuo5KJllH9MW1b1nCiMb/9OUIQMEAABEAgeAccTgLY5+V9mDAODh8JnixNJKjrzAyo5q4lE3MNl+Kb6uc+eQz0IgAAIgIAPBBxPAAxTjPLBj9CoTBz1CW8ctJJiPb0YElAvlM1bvDQ08OAICIAACIBAxgQcTwBIUFXG2lGwQwKx8nVUesnHlHdIqsP7zl007nFOFiSBAAiAAAgEiQAPATv7Sr1Y8Dl3YO/nrNToSmt/9UBqeYlXVUrHQ/WvsrpFR7FUD8cbohtHeA4CIAACuhFwtAeg7bn8g9D4Oxvi/BG8VPCCtWSUOLtUUJC6F42/s7GCNBAAARAIEgFHEwDDEFVBcj4otsYPWEWll35O8f0dmxewelPBxkeC4j/sBAEQAAEQcJ6AowkAxv+dD9B2iUbpJiq54AMqHN66/ZLtn0LRHw5+dlm7bQGoCAIgAAIgEHgCjiYA3KVcFXgiGjsg4ikqGLOMSsZtIJFve+hepY30HzV2E6aBAAiAAAh4QMCxmWUtdYX942n1mQc2QwUTkOt6UfOsMko3xrPjoehZPvIXBzVlRw2lQQAEQCB0BBzrAYil6bjQ0dHYIaMXLxX8+nLKPzLbnnzxe43dgmkgAAIgAAIeEXAsARAkj/XIZqjZTiCvjYrGvk/Fp20mimU0JLCyjIqe3l4dP0EABEAABKJLwLEEgEiMiC5Gfz3Pq/iYun1tNcW6732VgCDxF1Ffn/bXWmgHARAAARDQgYAjCYCq3Xr072AdHIqqDbF+a3ip4KeU9+XOdw9Mm8bDUeUDv0EABEAABHYl4EgCkOpeaDX++buKxievCYiiLVRc/T4VndC8p2pBS/vNe+3dPW/gCgiAAAiAQBQJOJIAUEwOjyI8LX02JOWf8BF1m8S7BxbutHugEvj2r2XAYBQIgAAI+EPAmQRAiWP8MR9aOyMQO3AldbvsC0r02zovQBnx1LTOyuI6CIAACIBA9Ag4kwAIMSR66PT3WHTfSMUXfWANCfyzz4tLV+hvMSwEARAAARDwikCWu8jsaZY1ATCl1KA97+CKDgSs3QN5SODPOtgCG4JBYNSdzZcJpboFw1pYCQLRI6AEra+7ueShXD3POQFI9So6kqTMWU6ujqB+pwRkIp54kqit0wK4AQI7E+CTIn/E53ocsPM1vAcBENCHAG/h20xK/Z0En+ySwyv3IQApMf6fQwBcrypovhi1ea3reqAABEAABEDAKwLFJ/+sfWCuynJPAEhg/X+uUXCzvhKz3BQP2SAAAiAAAt4TMJV5ZK5aHUgA1NG5GoH67hEw0+of7kmHZBAAARAAAT8I8FDdEbnqdSABoMNzNQL13SIg3iw8o+1jt6RDLgiAAAiAgE8EJPmbAKi60t7suvUPLw0JKJIvaGgWTAIBEAABEMidgL9DAOlkKucMJHcGkNAZAUMQEoDO4OA6CIAACASZgKDDeCUALwiw/8ppCEDF2AC8dCXQHi9qn6+rcbALBEAABEAgJwKFp97Z2j8XCTklAHwEMHoAcqHvbt2XxXHU6q4KSAcBEAABEPCLgCnMg3LRnVMCoJTCBMBc6LtYVwjxooviIRoEQAAEQMBvAsI4JBcTckoAePABQwC50HexriJR56J4iAYBEAABEPCZgCTlTwKgFlOCfc9p/MFndmFW35KItSwNs4PwDQRAAASiToDP7PBnCKB9bb61V3hOPQhRD56L/i8UoyjtonyIBgEQAAEQ8J2A8CcBiMUp532IfWcXUgOUoldD6hrcAgEQAAEQ2EEgp3bY9jd4PoLowB024J1OBGKksPxPp4DAFhAAARBwh0DhqTWby+yKtp8ASCQAdqG7XS8m819zWwfkgwAIgAAI+E8gHY8NsGuF7QTAMEROXQ92DUa9Lgl8IE5vWt9lKRQAARAAARAIAQHTmo9n62U7AeBx5gG2NKKSqwR4VugbriqAcBAAARAAAX0IGMKHBABLAPV5AHa2RAgkADvzwHsQAAEQCDEBPg5ggF33bPUAqFqKCSLbEw/sGot6XRMQQr3edSmUAAEQAAEQCAMBg6Tt/XhsJQDUrchq/GNhgBc2H5KmgR6AsAUV/oAACIBAJwR419d9O7nV5WVbCUDKoP26lIwCfhBYX3Ra62d+KIZOEAABEAABXwjYbo9tJQCGYfb1xU0o7YrAO10VwH0QAAEQAIFQEehbU6PsteV2MEiJMwDscHO9jqBlruuAAhAAARAAAZ0IxOqLmm3NybOVNSjD/piDTtTCZotQSADCFlP4AwIgAAJdETBSol9XZTq6bysBEEr07kgYrvlLQCrxvr8WQDsIgAAIgIDXBJQgW8PythIAUqqn1w5CX9cEhBAYAugaE0qAAAiAQKgICFK97DhkKwHgbAMJgB3aLtdJFLYgAXCZMcSDAAiAgIYEyu3YZCsBEIJsZRt2DESdjAmsE8fT5oxLoyAIgAAIgEA4CEh7bbKtBIAUegD0e2rECv1sgkUgAAIgAALuE/BwCICdwSRA9yOalQZFCglAVsRQGARAAARCQkAYtnrls+4BUHUUZ2SlIcEWGjf4bIYvQuMMHAEBEAABEMiYgLJ5Nk/WCQBRj5KMrUJBzwjwA7DSM2VQBAIgAAIgoA0BXgXQw44xWScArcl2fPu3Q9rlOvwAoAfAZcYQDwIgAAKaEuhmx66sEwAjJgvtKEIddwkoZax1VwOkgwAIgAAIaEqgux27sk8AZLzIjiLUcZeAYciN7mqAdBAAARAAAU0JeNMDIMi0lWloCi00ZimKIQEITTThCAiAAAhkRUBU1TRmPT8v6x4AMhSGALKKizeFpTSRAHiDGlpAAARAQDsCicLirHsBsk4AJMUKtPMcBlG+SmwCBhAAARAAgWgSSJmm+wmAkBKrAHR8vjZtQQ+AjnGBTSAAAiDgBQFlZP3lPOseAPYj5oUv0JEdATGRktnVQGkQAAEQAIGwEDCUzHqCvp0EICy8wuTHljA5A19AAARAAASyI2AokZddDSIkANkS07K8MLU0C0aBAAiAAAh4QkDFDA9WAZDKepzBE++hBARAAARAAASiS8A6pyerV/Y9ACL7iQZZWYTCWRPgbYAxBJA1NVQAARAAgfAQ4BNhs56gn30CEB5eofGEDwJKh8YZOAICIAACIJA9Ad4NLttKSACyJYbyIAACIAACIBACAkgAQhBEQZT12E8I3IYLIAACIAACORDIPgFQsi0HfajqAgFFIuvZny6YAZEgAAIgAAK+EfBkDoBAAuBbgKEYBEAABEAABDogoATmAHSAJQKXVCICTsJFEAABEAABBwlkPwTgoHKIcoxA1ltAOqYZgkAABEAABAJJwE4CgF3nNAy1eobyNTQLJoEACIAACGhKIOsEQBnGZk19ibZZecU9og0A3oMACIAACGRDIOsEwCATkwCzIexR2XYjjQTAI9ZQAwIgAALaERAq6975rBMAkqJVO8dhEBnK6A4MIAACIAACUSUgsu6dzzoB4N0GN0UVr85+C1OiB0DnAME2EAABENCMQNYJgDTSLZr5AHOYgBQGEgA8CSAAAiAAAhkTyD4BMA0MAWSM17uCQsje3mmDJhAAARAAgaATyDoBKMzLz3qcIeiQgmC/kqJ/EOyEjSAAAiAAAs4TECL7Y+GzTgCINuLseedjl7NEPhCoX85CIAAEQAAEQCCgBIysj4XPOgEQo7aePY9eAM0eESVoX81MgjkgAAIgAAIeEVCmbMpWVdYJwDYFa7NVhPLuEuAeAAwBuIsY0kEABEBAWwIqRh7sA2C5L2i9thSiahh6AKIaefgNAiAAAqSUyHqJvq0eAKVoHXhrRkDRPupFwmZAmoUF5oAACICAFwTipkc9AEKhB8CLgGarIyWLDsq2DsqDAAiAAAgEn0A6Ect6bp6tHgASAkMAGj4vKqYO1tAsmAQCIAACIOA2gfZU1iv0bCUASihMAnQ7mDbkG4QEwAY2VAEBEACBwBPoQ6XerAIQUq0MPK0QOsBzMzAEEMK4wiUQAAEQ6IJA24wakeyizB63bfUAGAZ9vockXPCfABIA/2MAC0AABEDAawKCsv72b5loKwGQMrbKa/+gLwMCgo7MoBSKgAAIgAAIhImAEt4lAAlJX4SJXYh86db6bMGAEPkDV0AABEAABLokoLxLAKippZHtyXrXoS59QIGcCRgJ45ichUAACIAACIBAkAhssGOsrSEAMZFMRWQlAXhpRsBQ8mjNTII5IAACIAAC7hKwtTmfrQTA8oP3nsdEQHcDalO6Qg+ATXKoBgIgAALBJCA8TgAEfRxMUOG2WgmBBCDcIYZ3IAACILALAaXkml0uZPjBdg+AlGp5hjpQzEsCigaoZ0r6eKkSukAABEAABPwjYAh7Q/K2EwBh0Ef+uQvNeyOQTCSP29t93AMBEAABEAgVAY+HAAgJgLaPjxJIALQNDgwDARAAAWcJCClsbc9vuwfATBOGAJyNoWPShBAjHRMGQSAAAiAAAnoTULTajoG2E4D83u2fsEJpRynquE6gUtVSnutaoAAEQAAEQMB3AmkpbZ3PYzsBEJWUYq+xFND30HdoQH5qn8IhHd7BRRAAARAAgTARSNbXdPN2CMCix5sB/TtMFMPkiyA1Jkz+wBcQAAEQAIE9CXA7bHtrfts9AJYZPNb87p7m4IoOBJSgU3WwAzaAAAiAAAi4R0CQsNX9b1mUUwLAfQDvuOcWJOdEQNEI9TwV5yQDlUEABEAABDQnoGwPxeeUAAgTQwAaPxkJ08iv0tg+mAYCIAACIJA7AX96AOJ5CfQA5B481yRIZWAYwDW6EAwCIAAC/hMQij61a0VuPQCjNlszD23NPrRrMOplQUCoU7IojaIgAAIgAAIBIyAN9bFdk3NKALYpxURAu/Tdr3d42+z8Q9xXAw0gAAIgAAJ+EBDK+NiuXgcSAPGGXeWo5z6BGBnnuq8FGkAABEAABPwgkDRStnfldSABUEv9cBo6MyOglDovs5IoBQIgAAIgEDACm+bf1GODXZtzTwAM43W7ylHPEwLDm18o6ueJJigBARAAARDwjoCij3NRlnMCkFjX8i82IJ2LEajrKgGRIHOsqxogHARAAARAwHMCQtifAGgZm3MCICZSkrcEfNtzz6EwIwKKBD3TfsxZGRVGIRAAARAAgQAREO/nYmzOCcBW5UotycUI1HWHQLPsTj9qOpHuaO5/yjGzzu3hjhZIBQEQAAEQ8IWAEO/lojeeS+X/1hXqdeLN5/HSh8Cy9Jfoti2H0XIzYRmVl0jGqvnnH/SxEJboSmDuzSUDdLUNdvlHYNRdzWOFUk/4ZwE070nA1KAHwDQW7GkYrvhF4Ln2o+ibTYO2N/5bzVBSXeiXPdALAiAQAgJSVoTAi1C5EEvm1gPgyBBAYlOrtRSwPVRkA+hMuyqke7YcR7dv2Z/a1W6hFeLEoVPP2T+AbsFkEAABDQjw6a+DNTADJuwgsPGFmtLGHR+zf7dbK5G9AKvG1omARNgPwB4+R2qtlH3pmqbj6LH2fTqTJ6SIoxegMzq4DgIg0BUB9AB0Rcjb+zl1/1umOpIA/Mdn9aq3vkPbdgKvpQ6lyzYOprfSBdsvdfiTZ2l8g6xlAXiBAAiAQBYETrhrcx8ujv1EsmDmdlGlKOdt+B1LABQZr7ntMOTvSkByW/7nlqF0fdNBtGn3Lv9di27/9OWh0yaM3v4BP0EABEAgEwJ5QuDbfyagPCxjCHorV3WOJQBmnP6ZqzGonzmBjbIH3dhURX9sLSOZeTUer1FXZlMcZUEABECAJxEfDwp6EeDvfPokAEWjWj/nvuUv9EIUTmveSQ2kyzcNp1dSRVk7qIjOPeqh88qyrogKIAACESZgVEXYeS1djxnC2oU3p5djPQCWFdy41OdkDSp3SWBW2zF0VdMRtFLa3sIhkZcvLulSEQqAAAiAABOoqlE8uUgNBQytCKx/8cbiFbla5GgCwBlAfa4GoX7HBFpVEd25+QS6u3m/nA9eUEpcXV1bHetYE66CAAiAwA4C8diWY/lT3o4reKcBgZy7/y0fHE0ApFT1GoAJnQmfmP3p6k3H0f9LdnPENx6qGfCRVOMcEQYhIAACoSYgDaoKtYOBdE686YTZjiYABae3L8M8ACfCskNGXXIQfWPTV+h9M3/HRQfeGaSuc0AMRIAACISegBgVehcD5iAPt7/uhMmOJgCWQZgH4ERY+Hxl3tXvf5uPpZs3D6DmzJb4ZaWY43Ts0KkTjsuqEgqDAAhEisBpNZt6ssNYAaBZ1PkL3GInTHI8AcA8gNzD0mj2oes2j6BH2nrlLmwvEpRAL8Be8OAWCESeQDoeO4MhON9ORJ5sTgDazFTxOzlJ2FbZ8cDKmKpzwrCoyliSPIi+0TSEFqcKvUBw3pDa6oO8UAQdIAACwSOgDHFO8KwOt8WC1Ov1NSLthJeOJwAFY9o/ZMOWO2FclGRYO/Q+2lJB12w+lNbaX+KXLTIjZspbsq2E8iAAAuEnUF2j8kip08LvabA85F13FzllseMJwFbDhHjGKQOjIGcL7+p3a9OJdH9r3+x29XMAjhJ0EXoBHAAJESAQMgLrE80nsUvOLD0KGRs/3VEOjf9bPriSABgkn/MTUJB0L0sPoG82DaO5qRK/zI4Z0rzeL+XQCwIgoCcBSWq8npZF2ypDODMB0KLIq/acf6mnqChVULCBJWPziL3gfabtKLq7ZT9qd2GW/17UdnQrpQzjoIaJMz7t6CaugQAIRIvAGb9R+e2bm1ey152eLx4tItp4u3HulOKeJAQv5Mr95UoPgDibWti0l3M3L5wS2nmJ391bRtIdzfvr0PhbkBNCypvDSRtegQAIZEugvan1TK6Dxj9bcO6Xf9Wpxt8y1ZUEwBIsMA/AwrDHa4Xcl77TNJJmtffY457PFy6vrK0+1GcboB4EQEAHAkJdpIMZsGE3AkL8c7crOX10LQGQynw2J8tCWPnV5OF0+cZj6O20s7v6OYQqRlLe5ZAsiAEBEAgogaqaDfztRJ0VUPPDbbYpg5EA5J+SfJcjsSzc0cjMO8lTLf7UMox+sPlA2uT/eP/ejB43rLZ6xN4K4B4IgEC4CcTy8s5nDzF/S78wm9JsXeikWa71AFhG8nKFWU4aG0RZG2Rvur6piv7U2sfzJX52eEnT/IWdeqgDAiAQEgJKXRUST8LlhqI362vKtjjplKsJgGEY/3DS2KDJejv1ZT7Ip4JeSxUFx3Qhjq+cOm5scAyGpSAAAk4RGH1H03E8vfwYp+RBjoMEBM11UNpWUa4mAPGXW1/jh2mV00YHQd7jrYPp6qbDaKV3u/o5h0WIew965gwtJyo45yQkgQAI7EHAML6zxzVc0IIAT6yvd9oQVxMAUUOSVys+4bTROstrVt3o9s0n0C9b+pEjmzX74+yBPZqKsDmQP+yhFQR8ITDmzi3lPG47wRflUNoVASmMdseX1ruaAFgeCUNFZhjgY7M/Xb1pGD2XDMXumTcPnXrO/l09lbgPAiAQDgI8WfkK9iQRDm9C58XS2T/suclpr1xPAOLJ9jo2uslpw3WTN6f9SLp801domRmanvNCEvFf6cYZ9oAACDhPYMQ9qlAo9S3nJUOiQwTqHZKzixjXEwBxJrWzxpm7aA3RhzTv6vfb5hF065YDqFXvJX5ZU+f5G9VDp04Yk3VFVAABEAgUgcKWlot5tXLfQBkdIWP5tFjri7TjL9cTAMtiPr94uuOWayCw0exD39s8gqa29dTAGndMUEI9WPHU2QFaxuAOB0gFgbASqHhQJfj3fEpY/QuBX8lEXlG9G354kgDEN7TPZuPXuOGAXzIXJw+hy5qG0NJUoV8meKX3y0Zz/u1eKYMeEAABbwl0X9t8IZ8Kh/k+3mLPRtsrL/xANGdTIdOyniQAYiKZfDhAbaZG6VyOu2Lo4dYKunbzwbQ+iEv8bMDlDZ2uHTZ1fKWNqqgCAiCgMYGamq3jlvj2r3GMeCjWtW31PUkALLZC0lSNGWdk2ibZg25uOpH+r6VvIHb1y8ipzArFTEF/rKqrimdWHKVAAASCQOClRPMktvPgINgaVRu5kX7eLd89SwDip7Rahxh85pYjbst9Lz2ArmwaRvWpErdVaSmfuwiP3ryq901aGgejQAAEsiZQXaPy+Pf6zqwrooJnBDg+K+fcXPKmWwo9SwAEzwRUgh51yxE35T7ddjRd1XQ4fWpGe4msEOpHQ2qrK9xkDdkgAALeEFgfb7Z2/RvgjTZosUOAu/9d+/Zv2eNZAmApU4b6i/UzKK82VUQ/2zKS7mruT+0hW+JnMwZxQ8pHsCrAJj1UAwFNCFhH/vIXsps1MQdmdEKAv3T9v05uOXLZ0wSgYHT7e2z1q45Y7rKQz81+9J2m4+jJ9h4uawqc+EOpOXF34KyGwSAAAv8lIOIJazgvvOuX/+tpoN8kzWTrc2564GkCsNURRX920yEnZM9PHs67+h1N76RDs6ufE1j+K0OQ+NbQR887/b8X8AYEQCAwBEbf0XoAD8leExiDo2voHKeP/90dpecJQCLdZi0HbNndEB0+m5RPv28ZTjdsPpA2o8t/ryFRRuyvQ2ursXPYXinhJghoSECkf8NWFWhoGUzaiQCf/uf6QXqeJwC8NXAT+6jd1sDrZW+6nrv8/9rae6cQ4G3nBFS5Ms1p1bXVsc7L4A4IgIBOBEbd0XwOL8oeq5NNsKVjAkaMnur4jnNXPU8ALNN5aYNWwwBvpr5M39hUQQtS2PE2q0dLiJOWS/njrOqgMAiAgC8ETr1bFfOkMuvbP176E1j04o3FK9w205cEIH5y20vs2DK3nctE/ozWwTzZ7zBaFZFd/TJhkmWZKRXTJpyaZR0UBwEQ8JiAmWy+jVV+yWO1UGeHgKDH7VTLto4vCYC1JwD3A/xftsY6Wb5ZdaMfbz6B7m3pR2knBUdPFn+pUI8OnXoO9hKPXuzhcUAIjLlzy1H8R/d/AmIuzDTTM7yA4EsCYDmWMBN/4x+tXji5u47l5v501aZj6flkt91v4bMdAoJ6KRH/B/YHsAMPdUDAXQJn/EblK0UPsRZs5e0uaqekL5l7a48PnRK2Nzm+JQDi9Kb1bNi0vRnnxr3Z7UfyeP+R9GHEd/Vzge0Q0Zz4E/ft8BQPvEAABHQh0N7UXMO/lUfrYg/s6IKAIE++/VtW+JYAbEUgjf/tAoVjt5OqkO5rHkE/2nIAtWKJn2NcdxUkJlVMH3/jrtfwCQRAwC8CY+5qGcGN/w1+6YdeGwQ86v63LPP921ryhYIFbMUwG5gyrrLa7EM/3nIUvZ7G0teModkvKCWJc5ZMeuxp+yJQEwRAIFcC1qz/dLLldd6E/aBcZaG+ZwSWzL25xLPzVvztAbCYGuTqZMCFqUO2LvFD4+/ZA2wYxJMCa6uP8UwjFIEACOxBwExuuQeN/x5YtL7A38g9PTDP9wQgkWyz5gGsdjoq1lD031qH0nVNB9M6hb1qnObbhbxSpeQzFbXVWHLUBSjcBgE3CIy5c/Mk/ht4hRuyIdM1AjJJIloJAO8M2M5Zz/1OIt0ke9APm06kB1vKSDopGLIyJ6BoX5Ly2WNmnYvTlDKnhpIgkDOBqp9uOkiR8YecBUGApwS4HXzx5ZuLV3qp1PceAMvZeDzxAP9wZEngv9MD6IpNw+jlVImXHKGrAwL8QB8RbzP+Mai2Oq+D27gEAiDg8LZ95wAAIuxJREFUMAFr3N+QsVnc9Y8/gA6zdVscf1l9yG0du8vXIgEQozav5fmIf93duGw/P9l2NK/vP5w+k4lsq6K8WwR4u+ACU/4dZwa4BRhyQWAHgXSy+Y/86cgdV/AuGATElpJU8T+8tlWLBMByWgp5H//gzaqyf7WpIvrplpH0s+b+lPR5ZWP21oe/Bu/8OHG5NP+APQLCH2t46B+BMXdtsZb7TfLPAmi2S0ApNfOpGtFit77detokAAUnt7/P58w/ma0jn5v96Go+xe+pdgw1Z8vO2/Li0srpE37trU5oA4FoEBh1Z/NXebe/n0bD2xB6aai/+OGVNgnANud/mQ2El5OH0+Wbjqb30vnZVENZ3wio71ZMnXCXb+qhGARCSGDUz7YczcerTGXXdPt7HkLarrj0ft1NJfNckdyFUK0emMQprfPZ3pe6sJlMyqcHWobTjZsPpM3Y1a8rXFrd55ODbqqYNv6HWhkFY0AgoARG39GynzDJ2nSrNKAuRN5sHiL9E/EfRj9AaJUAWAD4ZLm9fkNcx7v6Xcdd/g+19vaDF3Q6QIBXB/y0cvq42xwQBREgEFkCJ/9sfXeePfX/GED/yEIIvuOpWFL91S83tEsAEqe2v8AwFnQE5I3Ul+nypiG0KFXU0W1cCxIBJWqGTh//syCZDFtBQBcCI+5RhdLMe5L3O8MhP7oExZYd4qkXakobbVV1oJJ2CYDlkyHUHTv7Zu3qN721gr7bdBg1yvjOt/A+wAR40tKNSAICHECY7guB6loVK2xtns7KT/TFACh1joChHnROWPaStEwAYmPauVtLvW650yy7022bj6dft/SldPb+oYbmBKwkoHLahN9giaDmgYJ5WhCwGv91HzQ/xMacrYVBMCIHAmLZie3Fs3MQkHNVLRMAnhTB7YJxx4fp/emKpuE0O9ktZ0chQGcCvDpg2vhp2DFQ5xjBNt8JKCXWvt/8J7Zjsu+2wIDcCSj1vzU1wtfd6rVMACyyea+0zrqi6ci3lpvY1S/3J01/CdZmQYVS/r+RT4zFbGb9wwULPSZgffMffVfzw/x7crHHqqHOHQLNRjzpy9r/nd3RNgEQNSTbyLh5Z2PxPvQETm5vTdQPrq3uE3pP4SAIZEhgp25/fPPPkJn+xdTfZ/+w5ya/7dQ2AbDALDp/5lM8GPCq35Cg31MCQ2JSvlbx6PjDPNUKZSCgIYHqGpW37oOWWjYNjb+G8bFrkjKdPQHXrh1aJwCWUyIWu8muc6gXWAIHCoNe4xUCJwfWAxgOAjkSsE72W5vXbE2IHpejKFTXiYCguXU/Kn1bB5O0TwAWTZzxEm8c87wOsGCDpwS680zQ5yqmj7/KU61QBgIaEDi1ZnMZn+z3Eu8PhyRYg3g4aoISWW1576ju3YRx26r/q3Lq+MG8FcAS/S2Fhe4QEL8daIj/mTFxhumOfEgFAX0IjLmr6RCe8P8s938eqI9VsMQhAv+aO6X4KL+2/t3dB+17ACyDF18wcyl/G7TGwfCKJAH13eVSzh7+6NjySLoPpyND4OSfbK5SyuB5T2j8wxh0XsXxS10af4tvIBIAy9CYkLfyD3wDtGBE81VlGnlLhk6dcFw03YfXYScw5q7my6UhXmA/e4bd14j6t6Jnstg6tVGbV2ASgIWTZr2vyN9tE7WJWmQNUf2UUPUVU8dfE1kEcDx0BCoeVAle4/9bpdQf2TlsfBK6CP/HIf72/+sZNSKpk3uBmAOwHdiwx8/rJZPGMv7cY/s1/IwsgenKMK5smDjD97W0kY0AHM+ZwAl3Nu+bIGXt639CzsIgQGcCm2QqNaC+Zp+NOhkZmB4AC9rCcbPW8ZKYH+sEELb4RuB8IeVSDAn4xh+KcyQw6s4tY7jxX8pi0PjnyFL/6uo+3Rp/i1mgEgDL4JLy9ffzj39b7/GKPIGBPCQwr2LqhFura6tjkacBAIEgsHVb3zubb+PuV2u8HxNbAxG1nIxsThrmr3OS4FLlQA0BbGfAp8edwT0Bz2z/jJ8gwDtGzjclXbT0wsc/AQ0Q0JXA6DtaDyAhH+G/XyN1tRF2OU7g53NvLvmh41IdEBi4HgDL58WTHnuWl1I854D/EBEWAkIcH4uJt3nPiG/jaOGwBDVcfoy+c8slJMw30PiHK65deNMsU1KbjX92tzWQCYDlhFTmdfwDywJ3j2i0PxfzhlH3V04fP3dYbfXAaKOA97oQqPz7LYeOumvTE2yPdfpbd13sgh0eEBD0h/qabms90GRLRSCHALZ7yn/o7+Fve/+z/TN+gsBOBJr52bhx8Xtf+R3V1Ph65vZONuFthAhU1VXFN6/udb0gURNrOzy/aPVVJNJo/yP0CFjf/nnmPxIAV2I+/OELu6Xjbe9wFrOfKwogNPgElFqoBF3dMOlxbCUd/GgGxoMhtdUVhpTWuv5jthstzH2oePW3yWg9ePsl/AwzAaXumHtL6a06uxjoHgALLPcCjOdveo/pDBm2+U5A8tDA75Qwbsa+Ab7HItQGjHxibGmyNe823rTsWna0g5UpBhWsn0x5G6wzfgL/5zfUsczRuY287n+gjkv/dvYrFE9g5fQJT/Ms8K/u7Bjeg8DuBHgnrka+9v1FE2c+wn971e738RkEbBNQJCqnjbuIJyf/gmX07UpOonkYFay5nOcEFnRVFPeDSEDQTXOnlPxMd9NDkQAMfmTcATwD/B2GXaQ7cNinAQFrWCAW+z73BszXwBqYEHACVnd/TMr7OaM8NhtXjPS+VLTyu2QkMYKZDTftyypaFc8vPuiFH4hm3W0NRQJgQa6cPu4GUuLnugOHfVoReDxm0g8XXDjzA62sgjGBIHDs1HMHpCn2E+5NupANtvW3VKh8KlxzGcU3Z5U7BIJPZI1U4uq5txQ/EAT/bT20OjpmzbjdsrqXNdHrKzraB5u0JZDiv90PKJm4vWHyVG2X62hLL4KGDa6t7hNX8hY+ovxqdt+Rw3vymk6h/LWTSKh4BImGyuV3Zar4qPoakQ6CV6FJACzY1r7wvDWs1a0bKr+C8CCFwMZmniNwvzTzfolEIATRdMGFY2ad2yPeFr+WW+nvs/gSp1XEkwdR4apvk0jhNGCn2XolTwhx9pwpxU97pS9XPaFrKCumjb+PnfpermBQP7IEkAhENvQdO17x6AW9jVjyev7G/x0uUdxxKYeuylIqarya4s2DHBIIMZ4REDSXJ/6N8UyfA4rClwA8dXaRaM7j7TbpIAf4QER0CWxh13+XMIxfvzpxxhfRxRBdz4c/PK5/Oi54Ix+6kil4OF1fUP6G8ZS//ixWG7o/0WF9oPh0clEx+6Zi63THwLxC+XQNmTrhBEOolzgKofQvME9XOAxNCUWPKiF/uXjSrH+FwyV4sTcCQ6aNO9YgYa3jn8D/OljLv7fazt2LtwymgsZvkmG62+ngnMWRlvRXPvDn0qARCG0DWTlt/K84GNZ5AXiBgFMEniEp71t8wazZnFpiHwGnqGogp+LBKxKi+/rxfFCP1fAP18CkrSYY6TKeF/AdirUfoItJsGNPAk3ckB4y5+aS1Xve0vtKaBOAqr9cUrClcPPrjP9QvUMA6wJIYBm3/r/LM4y/8vDA+gDaD5O3ERg27bxDJBnf4M7Cr3PjX64jGGtlQMHar1Oi6SQdzYNNfB7N3FtK7gsiiNAmAFYwtnXlvcJvA3vqYRAfqgjZ3MbDA9NFzHhw4cQZr0bI70C7OqK2ujBlmlb3Pm/FJwLTqsa3nEiFjV/jRQh5geYfKuMFvS2TxccEZdnf7uxDnQBYzlZMH383/5G+fnfH8RkEnCTAPQIf8EZUf09Q+u+vXfCPj52UDVm5E7C6+Knb2lMNISZzrM5hiYEcWI+lvkSF1u6BqbLcoUBC7gSkGjP31tK5uQvyR0LoE4CDnjkjv0dT0ULGe5Q/iKE1ggTm8Z4CD8eFMRNDBP5Ff+u4fumaKjLEeD6SdyI3/Pv4Z41zmg1ZRPlrrqDElsHOCYUkOwSm8cS/C+xU1KVO6BMAC/SQaecdbpDRwG8LdQEPOyJBIM0bg8zj6YIz0yr5j6UXPLkiEl776GRFbXV3oeSZfDjYWB7XP5NN6eajOa6qzt80lncPPI91YITTVdAdC98kE3RY/Q0lqzq+HYyrkUgArFAMnTb+Cv4G8GAwwgIrQ0hA8S/bAt6pcpah1PMLz5/1JlYS5B7l6trq2MfSHKKUcQoPjp/MEk/gf/HcJQdDQqxtEBWtvpJEunswDA6LlQHa739vyCOTAFgQeGngTP4xbm9AcA8EPCJgfXN4kbumn29Pmi+++fVZjR7pDbaamhpj6CFvHS5jdALP7TmF/4CNCkvXvt3ACHMfKl79bTJaD7YrAvWyIiD+OXdK0fE8gZQfvWC/IpUA8Ozfnikl3+Au2f7BDhusDxkB6w8JH2et5vOQAf8zXuFVBctD5qMtd0Y+MbY02ZI3TBIdJww6jrv2R7AgfN3dg6ZBBesnU94GqxMkUn/W9yDh8oWUMtXguh+Vvu2yHk/ER+5J2bZLYD3TxcCZJ48YlNgiIGilkvQy/y1fymMHS9PtcmnYewmG1lb3pXT6GIqJwbyiYjBnRdYsty/zv8j9nbL1zHClRPNwKuDjhYXp4c7Fdo0NYj2l7ph7S+mtQTS9I5sj+Ys1dPq425USoQliR4HFtRAS4KSAe6+W8i/tm1LQv3kzwmVGQv174bhZ64LibQWf1RFvLRiQVvIQkuJQHrc/TCh1KPd8HMYNfihm6fsdi1iqH+8eyEsFk/38NiVc+nnNf35JccWz14j2sDgWyQTAmji0XEpr7eaJYQkk/Ig0gY3cNf4+f0/+iL8sf8ZDCSu4QeV/xmeplLmie7Lb6vpL/9rmJiFr583WRFNvFRN9lZK9KWb05tPz9uXlkP3555dY95c4eTmAbezlph2Q/R8CQuXzUsHLKW+zNrsaBz00plTi2PpbihcH3ZGd7Y9kAmABsLoblVS8VbCe23/uHCS8BwEHCFjfWjbwv438S79RCWElDe08jWmjJZt7FKx5CJus9zu/DEU9tn/mFQz5PGmxRClVyhOgrHH4Em7Qi7mmtdQukBvrbPctrD/zmk7jpYITuaMlMgsjXAklP/N31d1SerMrwn0UGtkEwGJeOXVCFf9mzOG3mA/g40MI1SAAAu4RMNoP3rpKQKQwwmKLcgi7/rdz8O2oy+0G+Plzxcx3Pt6v+vAUd5uO8dMO6AYBEAABtwio+HpKlr5C8eQA3kK4j1tqwio3rQxx1ovX5/HQWvhekU4ArHCumPHuK/u+M+go7go5PHzhhUcgAAIgwAREklKl/+SfMYq3HmJdAJYMCPC42C11U0pqMygayCLo+uaxz4KC5MUcvXcDGUEYDQIgAAIZEVDUvs9j1LLvb0jGmjOqEfFC83ofXPyLMDNAGrgtuhWPjj+MNxpZyB9Lwxxw+AYCIAACRrps61LBWLu1QAOvDghsIhU7eu4thZ90cC80l9ADsC2UDZNn/luSmMwfZWiiC0dAAARAoAMCMt5ILfvdTqlu8zu4i0u8suXqsDf+VpQjPwdg50d95WPvvL/vhCOS3C1i7aeJFwiAAAiEl4CQlC5eQjKxgeItg3hWAJqDbcF+eO4tJbeHN/A7PEMPwA4WW981nD/z55z9Td3tMj6CAAiAQCgJpEpfotb+d3EigPOoOMDvyVTL1aEMdAdOIQHYHQpPCkzEjMt5kxRrPgBeIAACIBB6Aum85dTSv4ZSJUtD7+teHGwzTKqurynbspcyobqFSYCdhHP4o2PLTSNhJQGYJdMJI1wGARAIH4GCjedQ3rpz2bGofT8U35x7c/EfwxfRzj1CAtA5G6qcdt6R/EvAi2exMmAvmHALBEAgZARirUdSUeOVJNLWLs/hf/GJm4/wev+Lwu/prh5GLcXb1fsuPi2eNOtfQsqJXMzsoihugwAIgEBoCJiF/6It/W8jWbgsND516ghv9auSLVd1ej/ENzDts4vgrpj572X9xh/+BR9+MraLorgNAiAAAuEhYLTyFsLzScgSirUfGB6/dvVkozTMMfW39lq16+VofEICkEGcV8x8dymfGcCsxEkZFEcREAABEAgJAUXpojdJ5q/mpYJHhu1UQT4UU0ysm1L6WkiClbUbSAAyRMZnBtTv968jBvBi2WMyrIJiIAACIBAKAjLvczJLXudzBA4nYYZjs1RF4raoTfrb/WHEHIDdiXT2mZcHFvdd9w2+/UxnRXAdBEAABMJKwEx8Ts28VDBZGvwV0vzn/Im6KUV3hDVWmfqFBCBTUlyuflR9WhUnq3mPgFezqIaiIAACIBAKAkq0U1vZ/1Jbn6mkRDqYPgl6qy3e9jWe18WH/UX7hWWANuI/ora6Z0rKl7gqLxPECwRAAASiR8BoP4SKV32LlwruExznBTXyUYjDorDPfyZBQQKQCaUOygx/eFx/My7q+daXO7iNSyAAAiAQegLC7M77BVxNsZbDg+Bru1RGVf0tRZGd9Ld7kJAA7E4ki89DHxl/oIzRPIa4XxbVUBQEQAAEQkRAUP6Gaspffyb7pHGTomgyH/KDc152evI0jtZOVmr8dnht9RGmNF/iB7+3xmbCNBAAARBwlUC8pYIKGi8nwyx2VY894aKGZ/z/2F7d8NZCAuBAbCtqq7/COwbWs6ieDoiDCBAAARAIJAEjXU6Fq77DGwdpdISKor9w4385Jv3t+UhhFcCeTLK+0jBxxltKkdX/1ZR1ZVQAARAAgZAQkPHV1LLf7ZTq9oouHj3b65Dib6Lx7zgc6AHomIutqxVTxw8Xgl7gytE4QcMWJVQCARCIAoHE5ioqWHMh7x6Y54u73LgtLkoVn/RUjWjxxYAAKEUC4HCQkAQ4DBTiQAAEAksgnhxIBau+TUaqj8c+iA9TQo54eUrpGo8VB0odEgAXwoUkwAWoEAkCIBBIAoYs5smBV1G8+Siv7P+CZPqkubf2+NArhUHVgwTApcghCXAJLMSCAAgEkkDBxnMpb905bLurU8/WKlNV1f2o9O1AQvLYaCQALgKvmDZuCAN+HksEXYQM0SAAAoEhEGv9Cm8cdCXvHujKgUJNyhCj624qbggMEJ8NRQLgcgC2LRG0Jgb2dVkVxIMACICA9gSE2ZOKV3+HjFZHN1FtFUKeNmdKt5e1B6CRgUgAPAjGkNrqg6x9Ahg2dgz0gDdUgAAI6E1AqDjlr5tMeZvGOGFoK0l11txbS+c6ISxKMpAAeBTtbWcHzGZ1h3qkEmpAAARAQGsCeVuOo/w1F5OQBXbtbOfG/0w0/vbwIQGwx81WrcG11X1iUj7DlSttCUAlEAABEAgZgViq/9bdA43kvtl6llJCTKibUvxkthVR/j8EkAB4/CTwnIDuhlKPK6VGe6wa6kAABEBASwJCFfBSwW9QYsvQTO1D458pqb2UQwKwFzhu3RpUW51XJOXDiqjaLR2QCwIgAAJBI5DXdAblr53AuwfG92Z6Kylx/txbip/aWyHc65oAEoCuGblTQpGonD7hHiJ1rTsKIBUEQAAEgkfAaD+MilddzUsFe3RgvNhCUp6DMf8O0Ni4hATABjQnq1RMH/d9ocTdLBOxcBIsZIEACASWgDC7834B36JYy2E7+9CkhHFq3ZSiBTtfxHv7BNDo2GfnWM3KqeO4z0s8xAILHRMKQSAAAiAQaAKC8jecT/nrT2cvxFrDpNGzf1TyVqBd0sx4JACaBGTItHHHGiSs2axen5qhCQGYAQIgAAJ7Ekg0D3u3aPXV5/ImP+/veRdXciGABCAXeg7XHVZbPdCU8mkOyhEOi4Y4EAABEAgigSXJpDzjza/Pagyi8brb7OqpDLo7r5t9CyfOWB5PF4xgu6y9AvACARAAgSgTeCG/MFWFxt+9RwAJgHtsbUlecNEjTQMNYyxX5hUCeIEACIBABAkoerjVMM5+5ZwnN0fQe89cxhCAZ6izV1QxffzFQtEDXNP2PpnZa0UNEAABEPCPADdKP1t0/swpvC6Kt0rBy00CSADcpOuAbD5IqMKQciaLOsABcRABAiAAAroSSJFSVy++4PE/6Wpg2OxCAhCAiA57/LxeMmlMZ1MdOTorAC7DRBAAgWgR2KiEGtdw/uN10XLbX28xB8Bf/hlpXzhu1jqeF3Aar4X9RUYVUAgEQAAEgkPgQyVpBBp/7wOGHgDvmeekcdumQX9lIcU5CUJlEAABEPCfwOx2M3/iWxc+usF/U6JnAXoAAhZzHh97LGYYw9jstwNmOswFARAAgR0EBN3LPZuno/HfgcTrd+gB8Jq4Q/pG1FYXpqX5Gz5T6BsOiYQYEAABEPCCQDsPZ16xeNJjD3mhDDo6J4AEoHM2gbhTOW3CJD5R8EE2tlsgDIaRIAACkSXA6/o+5r9X4xsmPb4kshA0chwJgEbBsGtKxbRzvywoNo3rV9qVgXogAAIg4DKBZ3i8/yJ0+btMOQvxSACygKVz0UG11XmFUv6UbbxOZzthGwiAQOQISF7id1vDxMfvxOY+esUeCYBe8cjZmsrp488kJf7M3WzlOQuDABAAARDIhYCgldKUFy2ZPGtuLmJQ1x0CSADc4eqrVGvjIJU0fsfjbdW+GgLlIAAC0SUgxHOmEF9fOnHGmuhC0NtzJAB6xycn6yqmjptsCHE/JwL75CQIlUEABEAgcwIpocSURZMe+xW6/DOH5kdJJAB+UPdQJy8X3C8t5Z84CeCdBPECARAAAVcJvGcoumjhBTMXu6oFwh0hgATAEYyaC+HNAvhkwas42HezpdhBUPNwwTwQCCIBRer/qDj1g4azn2oJov1RtBkJQISiPqy2eqCU8vfs8skRchuuggAIuEmAJ/oJU162aPKs59xUA9nOE0AC4DxT7SVyb8DFQtE9bGhP7Y2FgSAAAtoS4AbkUZEnr7EOLNPWSBjWKQEkAJ2iCfeNwbXVfeJS3sdzAyaH21N4BwIg4DwBsZrX9l/VcP7MfzgvGxK9IoAEwCvSmuoZ+uh5pyvDeIDNO0BTE2EWCICARgS49/BvbTL/f7Cjn0ZBsWkKEgCb4MJU7aiHvlacl9dyO/v0Pf4XC5Nv8AUEQMAxAsuFlN/CWL9jPH0XhATA9xDoY0DltPOOJDJ+wxaN0scqWAICIOAzAZP136OKkzWY4e9zJBxWjwTAYaBhEFcxbUK1IPUr9mX/MPgDH0AABGwTWCAlXbFk8sw3bUtARW0JGNpaBsN8I9Aw6bEZnO0fxgbcyf/47G68QAAEIkZgjRB0xeJ/f+U4NP7hjTx6AMIbW0c823bU8L0s7GxHBEIICICAzgRM3r73gfZ0/q2Y5KdzmJyxDQmAMxxDL2Xo1AljeNnPL9jRIaF3Fg6CQDQJzDOI1/RPmvVGNN2PntdIAKIXc/se85bCQ6dPmCxJ3cEPzgD7glATBEBAIwLLDKVuWHjB47M0sgmmeEAACYAHkMOmYlBtdV6BlN/hh+dm9g27CYYtwPAnEgT493cD799/e6sR+7+3J85IRsJpOLkLASQAu+DAh2wIHDPr3B7x9vhNROoarleQTV2UBQEQ8I1AmxJ0fzKdfxfG+X2LgRaKkQBoEYZgG1Hx93H7UkLcyA/TlewJEoFghxPWh5eAtZ7/T6ZK/XjpBU+uCK+b8CxTAkgAMiWFcl0SGFFbvV9KmrcSicu4cKLLCigAAiDgBQE+8oNqpWHcsmTijGVeKISOYBBAAhCMOAXKyora6i8JaU5BIhCosMHY8BHY2vDHDOP2BRNnvBM+9+BRrgSQAORKEPU7JbBTInApF8rrtCBugAAIOEkADb+TNEMsCwlAiIOri2vWHAEjIa7hv0pXs03ddbELdoBAyAik+Hfskbhh3I1v/CGLrEvuIAFwCSzE7klg5BNjS9va4lcIEteSov57lsAVEAABGwSaebjtD8oQ9zZMnPGpjfqoElECSAAiGng/3bb2ESiUahIvH/wB28EnEOIFAiCQLQHeq79RSnE/qcTvGiZPXZttfZQHASQAeAb8I8A7C1ZOn3A6nzz4Pe66PJUNwfPoXzSgOSAE+HflDd65774N3VunLjvzWRzWFZC46Wgm/uDqGJUI2jSktvogQ6pvc6/AJex+jwgigMsgsDcCkoR4WpG8r+H8x+v2VhD3QCBTAkgAMiWFcp4QqHjq7CKjJe9Cqejb/HAe7YlSKAEBbQmI1ULRH2RM/AHj+9oGKbCGIQEIbOjCbzgvIzxemPJbPDAwjr3ND7/H8BAE/kugnsf4fyc39prVcOXvU/+9ijcg4CABJAAOwoQodwhYZw4k2uOT+eCSS1lDpTtaIBUE/CXAY/tf8B/kvyoy/9Iw6R8f+msNtEeBABKAKEQ5RD5WTjvvSBLGZfzgXqgUlYXINbgSTQLt/Cw/SVL+edH7R79ANTUymhjgtR8EkAD4QR06cyZQ8eAVCeqx7qu8p8ClpNTpLBA7DeZMFQI8IsBf9qmeh7YeVsKYyWP7mzzSCzUgsAsBJAC74MCHIBLguQLdSclzDUUX8F/WMexDPIh+wObQE1jCHk5LGMajr06c8UXovYWD2hNAAqB9iGBgNgT4RMKeKamqeQLVRKVUFdc1sqmPsiDgMIEFSqgZMRF7fOHEGcsdlg1xIJATASQAOeFDZZ0JDH90bLlpJKp5/fRYHiaoYltxRLHOAQuHbWl2Yz7vZ/GEMmKPY+leOIIaVi+QAIQ1svBrFwLDH76wWzrefppQaiz3DnyVhwr22aUAPoCAfQJNPCH1OUOIJ9vMvGfeuvDRDfZFoSYIeEcACYB3rKFJEwLVtdWxj4mOJ6nO5qWFZ7NZh2hiGswIDoGlSonnDEM+Jzf2fhVr9YMTOFi6gwASgB0s8C6iBI6deu6AlIifzMMEpwihRvORBL0jigJud0KAe4y+4Emms5UQc5NJ87k3vz6rsZOiuAwCgSGABCAwoYKhnhCoqTEqD33raF6idTLPHTiFk4LjWW+hJ7qhRCMCYjWRrFNkzOFjduuXTJyxTCPjYAoIOEIACYAjGCEkrASq/nJJQVPBlqHcMzCSlxOM5LHeEZwc9AqrvxH1i8NK7/IfQ568J15RlH4FO/FF9EmImNtIACIWcLibIwE+wrhi6vhDrYSAE4GR3GDwP8whyJGqx9Wtb/dqIY/hLzKUuahNFS7AxD2PQwB1WhBAAqBFGGBEkAlYew+klRzCXyMHsx8V/O8Y/mdNLMTvF0Pw+fUJD+W8IUi+Qcp4PW6IBdiEx+eIQL02BPAHSptQwJAwERj5xNjS9rb4UUqKCu4t4IRAfOX/t3c/LW0EYRzHn2cmWCwu9SIRW2RvAfsC+j4K9eTLsxfzSjxVelAKwYMeKvUPoSkiYp7xN1489OChKS7Z78KSkA2783yGJc9MZmYV30h7s0xxdiUWTe38VaKcyPlEC+8cp5S/a1H9I5bZ7UoNUY4uCpAAdLFWKNPSCnza//whchqFx467j6zYjn60lBiUraUNenGB/dapTtWin2g9h4lWepyUnH/oIRDHatXfLO4ynAmBfgiQAPSjnomy4wIfD76srcZDG5bbbLat9Qla3ZytBqdtK0FolSAMOx7CvxZPDXa/VJznmmp3rtkXZ+ZFr+msvlfSdPptd6zjbAggsCgBEoBFSXIeBP6jQJ2NMFudvte0tI1kaehKCJQcbOiSm9rra00Qhhp10KhXof7N8E77a25qrfsfJTJTzZ64DvcrtdrVSvdrjZW4Seqyt5j/tMHgQoW8aM0ux7vj+WsWmGsj0DcBEoC+1Tjx9kagjkO4vbUm5zdNmkcT5msllfUKoBs/e5Tn8Qie3hYL9ab/vWm0fCQrtfvdIrnyDnt6fK2HT+tnnn0aD3G3MkizuF+ZHe59ffpuPcaGAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAi8LPALftI43x/9R9AAAAABJRU5ErkJggg=="
        />
      </defs>
    </svg>
  );
};

export const CWMembers = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: IconProps) => {
  return (
    <svg
      className={getClasses<IconStyleProps>(
        { iconSize, className },
        componentType,
      )}
      {...otherProps}
      xmlns="http://www.w3.org/2000/svg"
      width="88"
      height="88"
      viewBox="0 0 88 88"
      fill="none"
    >
      <path
        d="M44 61.875C51.5939 61.875 57.75 55.7189 57.75 48.125C57.75 40.5311 51.5939 34.375 44 34.375C36.4061 34.375 30.25 40.5311 30.25 48.125C30.25 55.7189 36.4061 61.875 44 61.875Z"
        stroke="#656167"
        strokeWidth="4.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M67.375 39.875C70.5779 39.8697 73.7377 40.6128 76.6024 42.0452C79.4672 43.4776 81.9576 45.5595 83.875 48.125"
        stroke="#656167"
        strokeWidth="4.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.125 48.125C6.04244 45.5595 8.53284 43.4776 11.3976 42.0452C14.2623 40.6128 17.4221 39.8697 20.625 39.875"
        stroke="#656167"
        strokeWidth="4.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.2 74.2505C26.0109 70.5417 28.8271 67.4161 32.3277 65.2298C35.8284 63.0435 39.8727 61.8843 44 61.8843C48.1272 61.8843 52.1715 63.0435 55.6722 65.2298C59.1728 67.4161 61.989 70.5417 63.8 74.2505"
        stroke="#656167"
        strokeWidth="4.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.6249 39.875C18.5371 39.8771 16.4919 39.285 14.7281 38.1679C12.9643 37.0508 11.5548 35.4548 10.6644 33.5664C9.77395 31.6781 9.43932 29.5753 9.69958 27.5038C9.95984 25.4322 10.8043 23.4776 12.1341 21.8682C13.464 20.2587 15.2245 19.061 17.2098 18.4149C19.1951 17.7689 21.3233 17.7011 23.3457 18.2196C25.3681 18.7382 27.2011 19.8215 28.6307 21.3431C30.0602 22.8647 31.0272 24.7617 31.4187 26.8125"
        stroke="#656167"
        strokeWidth="4.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M56.5813 26.8125C56.9728 24.7617 57.9398 22.8647 59.3693 21.3431C60.7989 19.8215 62.6319 18.7382 64.6543 18.2196C66.6767 17.7011 68.8049 17.7689 70.7902 18.4149C72.7755 19.061 74.5359 20.2587 75.8658 21.8682C77.1957 23.4776 78.0401 25.4322 78.3004 27.5038C78.5607 29.5753 78.226 31.6781 77.3356 33.5664C76.4452 35.4548 75.0357 37.0508 73.2719 38.1679C71.5081 39.285 69.4628 39.8771 67.375 39.875"
        stroke="#656167"
        strokeWidth="4.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
