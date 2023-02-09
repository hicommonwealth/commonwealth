import React from 'react';

/* eslint-disable max-len */

import 'components/component_kit/cw_icon.scss';

import { getClasses } from '../helpers';
import type { CustomIconProps, CustomIconStyleProps } from './types';

// ADDING CUSTOM ICONS: INSTRUCTIONS
//
// Base instructions + template for adding CWIcons can be found in cw_icons.tsx
// However, "custom" icons—defined as having static, predefined coloration—
// require slightly different handling:
// (1) The "fill" properties in path tags should be left in, to preserve coloration
// (2) Extra attention must be paid to the JSX conversion output, since distortions
//     of width, height, and coloration have been observed with some regularity

export const CWCosmosEvmMetamask = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#000"
        d="M12.892 7.862c-4.84 1.865-5.283 6.642-6.67 8.873-1.404 2.258-4.62 3.503-4.181 4.654.44 1.15 3.66-.086 6.208.648 2.518.726 6.03 3.978 10.87 2.113a8.683 8.683 0 005.07-5.223.403.403 0 00-.338-.539.397.397 0 00-.393.217 6.866 6.866 0 01-12.358-.121 6.894 6.894 0 01-.217-.504 6.995 6.995 0 01-.174-.521 78.534 78.534 0 015.035-2.135 78.77 78.77 0 015.076-1.77 57.357 57.357 0 012.806-.791l.182-.046a.26.26 0 01.306.16l.001.003c.028.073.052.146.078.22.168.476.293.956.376 1.438.036.21.265.325.454.224.694-.375 1.33-.74 1.898-1.092 2.116-1.308 3.289-2.418 3.048-3.047-.24-.629-1.852-.665-4.296-.216a38.586 38.586 0 00-3.054.7c-.781.207-1.605.446-2.463.712a81.5 81.5 0 00-5.074 1.772 82.328 82.328 0 00-4.657 1.957c-.017-2.795 1.665-5.437 4.417-6.498a6.83 6.83 0 014.97.016c.152.06.325.018.436-.103a.404.404 0 00-.108-.628 8.637 8.637 0 00-7.248-.473z"
      ></path>
    </svg>
  );
};

export const CWKeplr = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#207afe"
        d="M23 4h-1v2h2v19h-2v1.9h1a3 3 0 003-3V7a3 3 0 00-3-3z"
      ></path>
      <path fill="#06f" d="M5 21.9V9.1l10-1.7v16.2z"></path>
      <path
        fill="#06f"
        d="M17 2h-.7l-14 2.5A3.1 3.1 0 000 7.6v15.8a3.1 3.1 0 002.4 3.1l14 2.5h.6a3.1 3.1 0 003-3.2V5.2A3.1 3.1 0 0017 2z"
      ></path>
      <path
        fill="#207afe"
        d="M29 6h-1v2h2v15h-2v1.9h1a3.1 3.1 0 003-3.2V9.2A3.1 3.1 0 0029 6z"
      ></path>
    </svg>
  );
};

export const CWMagic = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#6452F6"
        d="M3.285 10.49c.88-.42 1.78-.8 2.63-1.26.85-.46 1.67-1 2.5-1.54 1.42 2.08 1.5 13 .14 16.57l-5.27-2.9v-.19c.073-.135.137-.276.19-.42.58-2.142.759-4.373.53-6.58a8.45 8.45 0 00-.72-3.3v-.38zM20.355 5.2a37.12 37.12 0 000 21.57l-4.35 4.46-4.34-4.45a36.87 36.87 0 000-21.57l4.34-4.44 4.35 4.43zM23.455 7.64l5.26 3a18.92 18.92 0 000 10.6l-5.27 3.07a36.701 36.701 0 01.01-16.67z"
      ></path>
    </svg>
  );
};

export const CWMetaMask = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#E2761B"
        stroke="#E2761B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M29.007 3.493L18.08 11.608l2.02-4.788 8.906-3.327z"
      ></path>
      <path
        fill="#E4761B"
        stroke="#E4761B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.792 3.493l10.838 8.192-1.922-4.865-8.916-3.327zM25.077 22.304l-2.91 4.458 6.226 1.713 1.79-6.073-5.106-.098zM2.636 22.402l1.779 6.073 6.225-1.713-2.91-4.458-5.094.099z"
      ></path>
      <path
        fill="#E4761B"
        stroke="#E4761B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.293 14.769l-1.735 2.624 6.182.275-.22-6.644-4.227 3.745zM22.514 14.771l-4.282-3.82-.143 6.72 6.17-.275-1.745-2.625zM10.644 26.76l3.71-1.812-3.205-2.504-.505 4.316zM18.448 24.948l3.723 1.812-.517-4.316-3.206 2.504z"
      ></path>
      <path
        fill="#D7C1B3"
        stroke="#D7C1B3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22.163 26.764l-3.723-1.812.297 2.427-.033 1.021 3.459-1.636zM10.636 26.764l3.459 1.636-.022-1.021.274-2.427-3.711 1.812z"
      ></path>
      <path
        fill="#342E37"
        stroke="#342E37"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.154 20.841l-3.096-.911 2.185-1 .911 1.911zM18.644 20.841l.91-1.91 2.197.999-3.107.911z"
      ></path>
      <path
        fill="#CD6116"
        stroke="#CD6116"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.64 26.758l.526-4.458-3.437.099 2.91 4.359zM21.644 22.302l.527 4.458 2.91-4.36-3.437-.098zM24.252 17.394l-6.17.274.57 3.173.911-1.91 2.197.999 2.492-2.536zM11.053 19.93l2.196-1 .9 1.911.583-3.173-6.182-.274 2.503 2.536z"
      ></path>
      <path
        fill="#E4751F"
        stroke="#E4751F"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.55 17.395l2.591 5.052-.088-2.515-2.503-2.537zM21.761 19.93l-.11 2.515 2.603-5.051-2.493 2.536zM14.733 17.667l-.582 3.173.725 3.745.165-4.93-.308-1.988zM18.08 17.667l-.296 1.976.132 4.942.736-3.745-.571-3.173z"
      ></path>
      <path
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.653 20.842l-.736 3.744.527.363 3.206-2.504.11-2.514-3.107.911zM11.058 19.93l.088 2.515 3.206 2.504.527-.363-.725-3.744-3.096-.911z"
      ></path>
      <path
        fill="#C0AD9E"
        stroke="#C0AD9E"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.706 28.395l.033-1.021-.274-.242h-4.14l-.252.242.022 1.02-3.46-1.635 1.209.988 2.448 1.702h4.206l2.46-1.702 1.207-.988-3.459 1.636z"
      ></path>
      <path
        fill="#161616"
        stroke="#161616"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.443 24.95l-.527-.363h-3.041l-.527.362-.275 2.427.253-.242h4.14l.274.242-.297-2.427z"
      ></path>
      <path
        fill="#763D16"
        stroke="#763D16"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M29.465 12.135l.933-4.48-1.394-4.162-10.564 7.84 4.063 3.437 5.743 1.68 1.274-1.482-.55-.396.88-.801-.682-.527.879-.67-.582-.44zM2.401 7.655l.934 4.48-.593.439.878.67-.67.527.879.801-.55.396 1.264 1.482 5.742-1.68 4.063-3.437-10.563-7.84L2.4 7.655z"
      ></path>
      <path
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M28.25 16.45l-5.742-1.68 1.746 2.625-2.603 5.05 3.426-.043h5.106l-1.932-5.951zM10.281 14.77L4.54 16.45l-1.911 5.952h5.095l3.415.044-2.592-5.051 1.735-2.624zM18.079 17.67l.362-6.336 1.669-4.513h-7.412l1.647 4.513.385 6.336.131 1.998.011 4.92h3.042l.022-4.92.143-1.998z"
      ></path>
    </svg>
  );
};

export const CWNearWallet = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#000"
        d="M24.937 3.853l-5.842 8.67c-.404.59.373 1.305.932.808l5.75-5.003c.155-.124.372-.031.372.186v15.632c0 .217-.28.31-.404.155L8.342 3.48c-.559-.684-1.367-1.057-2.268-1.057h-.622C3.836 2.423 2.5 3.76 2.5 5.407v22.002a2.984 2.984 0 005.532 1.554l5.842-8.67c.404-.591-.373-1.306-.932-.809l-5.75 4.973c-.155.124-.372.03-.372-.187V8.67c0-.218.28-.311.404-.156l17.402 20.822a2.921 2.921 0 002.27 1.056h.62A2.984 2.984 0 0030.5 27.41V5.407c-.031-1.647-1.367-2.984-3.014-2.984a2.996 2.996 0 00-2.549 1.43z"
      ></path>
    </svg>
  );
};

export const CWPhantom = (props: CustomIconProps) => {
  const { componentType, ...customIconStyleAttrs } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>(
        { ...customIconStyleAttrs },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
    >
      <g clipPath="url(#clip0_249_13967)">
        <path
          fill="url(#paint0_linear_249_13967)"
          d="M16 30.507c7.732 0 14-6.268 14-14s-6.268-14-14-14-14 6.268-14 14 6.268 14 14 14z"
        ></path>
        <path
          fill="url(#paint1_linear_249_13967)"
          d="M26.19 16.707h-2.503c0-5.064-4.15-9.169-9.268-9.169-5.056 0-9.166 4.005-9.266 8.982-.105 5.144 4.775 9.612 9.976 9.612h.654c4.586 0 10.732-3.551 11.692-7.878.178-.798-.46-1.547-1.285-1.547zm-15.49.225c0 .678-.56 1.231-1.245 1.231a1.241 1.241 0 01-1.244-1.23V14.94c0-.677.56-1.231 1.244-1.231.684 0 1.244.554 1.244 1.23v1.992zm4.32 0c0 .678-.56 1.231-1.244 1.231a1.241 1.241 0 01-1.244-1.23V14.94c0-.677.56-1.231 1.244-1.231.685 0 1.245.554 1.245 1.23v1.992z"
        ></path>
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_249_13967"
          x1="16"
          x2="16"
          y1="2.507"
          y2="30.507"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#534BB1"></stop>
          <stop offset="1" stopColor="#551BF9"></stop>
        </linearGradient>
        <linearGradient
          id="paint1_linear_249_13967"
          x1="16.328"
          x2="16.328"
          y1="7.538"
          y2="26.132"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff"></stop>
          <stop offset="1" stopColor="#fff" stopOpacity="0.82"></stop>
        </linearGradient>
        <clipPath id="clip0_249_13967">
          <path
            fill="#fff"
            d="M0 0H28V28H0z"
            transform="translate(2 2.507)"
          ></path>
        </clipPath>
      </defs>
    </svg>
  );
};

export const CWPolkadot = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#D32D79"
        d="M16 30c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16s6.268 14 14 14z"
      ></path>
      <path
        fill="#fff"
        d="M16 5.94c-4.16 0-7.56 3.38-7.56 7.56 0 .84.14 1.66.4 2.46.18.54.78.84 1.34.66.54-.18.84-.78.66-1.34-.22-.62-.32-1.28-.3-1.94.08-2.82 2.36-5.14 5.18-5.28a5.455 5.455 0 015.74 5.44c0 2.9-2.28 5.28-5.14 5.44 0 0-1.06.06-1.58.14-.26.04-.46.08-.6.1-.06.02-.12-.04-.1-.1l.18-.88.98-4.52c.12-.56-.24-1.12-.8-1.24-.56-.12-1.12.24-1.24.8 0 0-2.36 11-2.38 11.12-.12.56.24 1.12.8 1.24.56.12 1.12-.24 1.24-.8.02-.12.34-1.58.34-1.58a2.657 2.657 0 012.24-2.08c.24-.04 1.18-.1 1.18-.1 3.9-.3 6.98-3.56 6.98-7.54 0-4.18-3.4-7.56-7.56-7.56zm.54 17.4c-.68-.14-1.36.28-1.5.98-.14.68.28 1.36.98 1.5.68.14 1.36-.28 1.5-.98.14-.7-.28-1.36-.98-1.5z"
      ></path>
    </svg>
  );
};

export const CWRonin = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#1374E9"
        d="M26.762 18.258c-.013-.549-.1-1.141-.49-1.588-.592-.68-1.236-1.302-2.21-1.396a.52.52 0 01-.151-.068c.033-.037.07-.107.097-.104.405.052.702-.223 1.016-.378 1.153-.568 1.709-1.571 1.738-2.826.037-1.737.012-3.475.007-5.211 0-.608.017-1.216-.164-1.824-.173-.578-.592-1.303-1.11-1.637a4.737 4.737 0 00-2.315-.72H11.196a8.611 8.611 0 00-1.643.153C8.377 2.89 7.11 4.07 7.123 5.48c.014 3.145 0 6.289 0 9.434 0 3.145 0 6.29-.01 9.434.01.313.079.622.201.911.312.861 1.063 1.345 1.73 1.854.776.594 1.519 1.229 2.303 1.812.607.447 1.173.933 1.769 1.389 0 0 .182.193.303.143.207-.082.163-.24.181-.371a4.531 4.531 0 000-.627V17.873a5.454 5.454 0 010-.63.608.608 0 01.608-.53h3.784a1.29 1.29 0 01.427.055 2.378 2.378 0 011.662 2.334v10.512a4.133 4.133 0 000 .628c.044.272.375.348.593.162.76-.638 1.507-1.28 2.279-1.904.489-.396 1.012-.76 1.502-1.15.507-.396.991-.821 1.448-1.274a2.887 2.887 0 00.836-1.983c.053-1.945.057-3.891.023-5.836zm-6.662-6.8c0 .934-.644 1.715-1.537 2.035a3.14 3.14 0 01-1.1.163H14.22c-.501 0-.608-.114-.608-.628V6.383c0-.523.283-.81.798-.812a698.49 698.49 0 015.043 0c.567 0 .643.084.646.68v2.604c0 .867.006 1.735.001 2.602z"
      ></path>
    </svg>
  );
};

export const CWTerraStation = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#0E3CA5"
        fillRule="evenodd"
        d="M14.371 24.214c.743 2.834 3.41 4.997 4.756 4.908.047-.003 5.108-.976 7.878-5.747 2.156-3.713 1.422-7.297-1.51-7.375-1.056.079-12.54 2.814-11.124 8.214zm2.547-21.339c-1.91 0-3.722.41-5.362 1.141a7.83 7.83 0 00-.837.411c-.185.1-.371.198-.55.304l.042.014A6.033 6.033 0 008.817 6.07c-3.793 5.021 8.919 8.671 15.714 8.684 3.128 2.249 4.006-6.335.95-8.717a13.108 13.108 0 00-8.563-3.161z"
        clipRule="evenodd"
      ></path>
      <path
        fill="#5493F7"
        fillRule="evenodd"
        d="M12.141 5.819c-1.718 2.524-7.444 4.304-8.386 4.026l-.004-.01.117-.228A13.574 13.574 0 017.95 4.951c.353-.253.718-.489 1.095-.709.8-.454 1.621-.481 1.891-.492 2.55.047 1.218 2.048 1.204 2.069"
        clipRule="evenodd"
      ></path>
      <mask
        id="mask0_238_29603"
        style={{ maskType: 'alpha' }}
        width="9"
        height="19"
        x="2"
        y="11"
        maskUnits="userSpaceOnUse"
      >
        <path fill="#fff" d="M2 11.624h8.75v17.5H2v-17.5z"></path>
      </mask>
      <g mask="url(#mask0_238_29603)">
        <path
          fill="#5493F7"
          fillRule="evenodd"
          d="M10.699 24.737c.128.83-.003 4.108-.176 4.385-.148.008-.457.027-1.35-.468a14.23 14.23 0 01-4.432-3.903A13.792 13.792 0 012 16.474a13.78 13.78 0 01.873-4.85h.002c1.025 1.345 2.21 2.56 3.217 3.918.96 1.292 2.279 3.398 2.547 3.848 1.667 2.794 1.933 4.518 2.06 5.347z"
          clipRule="evenodd"
        ></path>
      </g>
      <path
        fill="#5493F7"
        fillRule="evenodd"
        d="M30 16.63c0 1.792-.341 3.505-.96 5.076-1.622 1.751-12.566-2.557-12.674-2.604-1.496-.658-6.052-2.66-6.463-5.805C9.31 8.773 18.462 5.62 22.483 5.5c.482.005 1.95.022 2.804.72A13.81 13.81 0 0130 16.629v.002zm-9.57 11.19c.655-2.317 6.376-4.69 7.64-4.819.155-.016.221.094.153.22-1.317 2.396-3.268 4.368-5.628 5.647-1.193.579-2.506.157-2.165-1.048z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWTerraStation2 = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      transform="scale(0.5)"
      viewBox="0 0 64 64"
      {...otherProps}
    >
      <path fill="#FFF" d="M0 0h64v64H0z" opacity="0" />
      <linearGradient
        id="a"
        x1="43.755"
        x2="43.755"
        y1="605.123"
        y2="575.012"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#4366c2" />
        <stop offset=".15" stopColor="#3458b8" />
        <stop offset=".4" stopColor="#2348ac" />
        <stop offset=".67" stopColor="#193fa5" />
        <stop offset="1" stopColor="#163ca3" />
      </linearGradient>
      <path
        fill="url(#a)"
        d="M27.5 50.9c1.8 6.5 8 11.5 11.2 11.3.1 0 12-2.2 18.6-13.2 5.1-8.5 3.4-16.7-3.6-16.9-2.4.1-29.5 6.4-26.2 18.8"
      />
      <linearGradient
        id="b"
        x1="35.363"
        x2="35.363"
        y1="572.988"
        y2="544.859"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#4366c2" />
        <stop offset=".15" stopColor="#3458b8" />
        <stop offset=".4" stopColor="#2348ac" />
        <stop offset=".67" stopColor="#193fa5" />
        <stop offset="1" stopColor="#163ca3" />
      </linearGradient>
      <path
        fill="url(#b)"
        d="M53.1 9.1c-8.9-7.6-21.3-9.4-32-4.6-.7.3-1.3.6-1.9.9-.4.2-.8.5-1.2.7h.1c-1.3.9-2.4 1.9-3.3 3.1-8.6 11.5 20.5 19.9 36.1 19.9 7.2 5.2 9.2-14.5 2.2-20z"
      />
      <linearGradient
        id="c"
        x1="3.311"
        x2="23.727"
        y1="554.677"
        y2="554.677"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#58c66b" />
        <stop offset="1" stopColor="#5491f6" />
      </linearGradient>
      <path
        fill="url(#c)"
        d="M22.9 9.3c-4 6-17.4 10.3-19.6 9.6l.3-.6c.7-1.5 1.6-2.9 2.6-4.3 2-2.6 4.3-5 7-6.9.8-.6 1.7-1.2 2.5-1.7 1.3-.8 2.9-1.2 4.4-1.2 6 .1 2.8 4.9 2.8 4.9"
      />
      <linearGradient
        id="d"
        x1="0"
        x2="19.717"
        y1="585.099"
        y2="585.099"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#58c66b" />
        <stop offset="1" stopColor="#5491f6" />
      </linearGradient>
      <path
        fill="url(#d)"
        d="M19.6 52c.3 1.9 0 9.4-.4 10-.3 0-1 .1-3-1.1-1.1-.6-2.1-1.3-3.1-2-1.3-1-2.5-2-3.7-3.2-1.2-1.1-2.2-2.4-3.2-3.7-2-2.7-3.5-5.6-4.5-8.8-.5-1.6-1-3.3-1.2-4.9-.6-3.4-.6-7 0-10.4.3-1.7.7-3.3 1.2-4.9.1-.3.2-.6.3-1 2.3 3.1 4.9 5.9 7.2 9s5.1 7.8 5.7 8.8c3.8 6.5 4.4 10.4 4.7 12.2"
      />
      <linearGradient
        id="e"
        x1="17.27"
        x2="64"
        y1="569.606"
        y2="569.606"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#58c66b" />
        <stop offset="1" stopColor="#5491f6" />
      </linearGradient>
      <path
        fill="url(#e)"
        d="M64 33.1c0 4-.8 8-2.2 11.8-3.8 4-29.2-5.9-29.4-6-3.5-1.5-14.1-6.2-15-13.5C16 14.9 37.2 7.6 46.5 7.3c1.1 0 4.5 0 6.5 1.7 7 6.1 11 14.9 11 24.1"
      />
      <linearGradient
        id="f"
        x1="41.637"
        x2="59.921"
        y1="598.293"
        y2="598.293"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#58c66b" />
        <stop offset="1" stopColor="#5491f6" />
      </linearGradient>
      <path
        fill="url(#f)"
        d="M46.8 61.6c-2.8 1.3-5.8.4-5-2.4 1.5-5.2 14.8-10.5 17.7-10.8.4 0 .5.2.4.5-3.1 5.4-7.7 9.8-13.1 12.7"
      />
    </svg>
  );
};

export const CWUnreads = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#342E37"
        fillRule="evenodd"
        d="M17.675 5.653a2.247 2.247 0 10-3.55-.057c-4.416.763-7.775 4.59-7.775 9.194v6.417a.585.585 0 01-.587.583H4.588a.585.585 0 00-.588.584v1.166c0 .322.263.584.588.584H13.281a3.456 3.456 0 104.936 0h8.694a.585.585 0 00.588-.584v-1.166a.585.585 0 00-.587-.584h-1.175a.585.585 0 01-.588-.583V14.79c0-4.5-3.207-8.255-7.474-9.137z"
        clipRule="evenodd"
      ></path>
      <circle cx="23.75" cy="9" r="4" fill="#EC79DE"></circle>
    </svg>
  );
};

export const CWWalletConnect = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#3B99FC"
        d="M8.133 10.883c4.567-4.377 11.97-4.377 16.537 0l.755.724a.273.273 0 010 .397l-2.086 2a.3.3 0 01-.413 0l-.756-.726c-3.186-3.053-8.351-3.053-11.537 0l-.81.777a.3.3 0 01-.413 0l-2.086-2a.273.273 0 010-.396l.809-.777zm20.218 3.527l1.879 1.8a.546.546 0 010 .795v.001l-7.544 7.23a.602.602 0 01-.826 0l-5.355-5.133a.15.15 0 00-.207 0l-5.355 5.133a.602.602 0 01-.826 0l-7.544-7.23a.546.546 0 01-.001-.794l.001-.001 1.879-1.8a.3.3 0 01.413 0l5.562 5.33a.15.15 0 00.206 0l5.356-5.133a.601.601 0 01.825 0l5.356 5.133a.15.15 0 00.206 0l5.562-5.33a.3.3 0 01.413 0z"
      ></path>
    </svg>
  );
};
