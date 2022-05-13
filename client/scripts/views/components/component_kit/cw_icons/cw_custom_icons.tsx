/* @jsx m */

/* eslint-disable max-len */

import m from 'mithril';

import 'components/component_kit/cw_icon.scss';

import { getClasses } from '../helpers';
import { CustomIconAttrs, CustomIconStyleAttrs } from './types';

export const CWMetaMask: m.Component<CustomIconAttrs> = {
  view: (vnode) => {
    const { componentType, ...customIconStyleAttrs } = vnode.attrs;
    return (
      <svg
        class={getClasses<CustomIconStyleAttrs>(
          { ...customIconStyleAttrs },
          componentType
        )}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 32 32"
      >
        <path
          fill="#E2761B"
          stroke="#E2761B"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M29.007 3.493L18.08 11.608l2.02-4.788 8.906-3.327z"
        ></path>
        <path
          fill="#E4761B"
          stroke="#E4761B"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.792 3.493l10.838 8.192-1.922-4.865-8.916-3.327zM25.077 22.304l-2.91 4.458 6.226 1.713 1.79-6.073-5.106-.098zM2.636 22.402l1.779 6.073 6.225-1.713-2.91-4.458-5.094.099z"
        ></path>
        <path
          fill="#E4761B"
          stroke="#E4761B"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.293 14.769l-1.735 2.624 6.182.275-.22-6.644-4.227 3.745zM22.514 14.771l-4.282-3.82-.143 6.72 6.17-.275-1.745-2.625zM10.644 26.76l3.71-1.812-3.205-2.504-.505 4.316zM18.448 24.948l3.723 1.812-.517-4.316-3.206 2.504z"
        ></path>
        <path
          fill="#D7C1B3"
          stroke="#D7C1B3"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M22.163 26.764l-3.723-1.812.297 2.427-.033 1.021 3.459-1.636zM10.636 26.764l3.459 1.636-.022-1.021.274-2.427-3.711 1.812z"
        ></path>
        <path
          fill="#342E37"
          stroke="#342E37"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M14.154 20.841l-3.096-.911 2.185-1 .911 1.911zM18.644 20.841l.91-1.91 2.197.999-3.107.911z"
        ></path>
        <path
          fill="#CD6116"
          stroke="#CD6116"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.64 26.758l.526-4.458-3.437.099 2.91 4.359zM21.644 22.302l.527 4.458 2.91-4.36-3.437-.098zM24.252 17.394l-6.17.274.57 3.173.911-1.91 2.197.999 2.492-2.536zM11.053 19.93l2.196-1 .9 1.911.583-3.173-6.182-.274 2.503 2.536z"
        ></path>
        <path
          fill="#E4751F"
          stroke="#E4751F"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.55 17.395l2.591 5.052-.088-2.515-2.503-2.537zM21.761 19.93l-.11 2.515 2.603-5.051-2.493 2.536zM14.733 17.667l-.582 3.173.725 3.745.165-4.93-.308-1.988zM18.08 17.667l-.296 1.976.132 4.942.736-3.745-.571-3.173z"
        ></path>
        <path
          fill="#F6851B"
          stroke="#F6851B"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M18.653 20.842l-.736 3.744.527.363 3.206-2.504.11-2.514-3.107.911zM11.058 19.93l.088 2.515 3.206 2.504.527-.363-.725-3.744-3.096-.911z"
        ></path>
        <path
          fill="#C0AD9E"
          stroke="#C0AD9E"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M18.706 28.395l.033-1.021-.274-.242h-4.14l-.252.242.022 1.02-3.46-1.635 1.209.988 2.448 1.702h4.206l2.46-1.702 1.207-.988-3.459 1.636z"
        ></path>
        <path
          fill="#161616"
          stroke="#161616"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M18.443 24.95l-.527-.363h-3.041l-.527.362-.275 2.427.253-.242h4.14l.274.242-.297-2.427z"
        ></path>
        <path
          fill="#763D16"
          stroke="#763D16"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M29.465 12.135l.933-4.48-1.394-4.162-10.564 7.84 4.063 3.437 5.743 1.68 1.274-1.482-.55-.396.88-.801-.682-.527.879-.67-.582-.44zM2.401 7.655l.934 4.48-.593.439.878.67-.67.527.879.801-.55.396 1.264 1.482 5.742-1.68 4.063-3.437-10.563-7.84L2.4 7.655z"
        ></path>
        <path
          fill="#F6851B"
          stroke="#F6851B"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M28.25 16.45l-5.742-1.68 1.746 2.625-2.603 5.05 3.426-.043h5.106l-1.932-5.951zM10.281 14.77L4.54 16.45l-1.911 5.952h5.095l3.415.044-2.592-5.051 1.735-2.624zM18.079 17.67l.362-6.336 1.669-4.513h-7.412l1.647 4.513.385 6.336.131 1.998.011 4.92h3.042l.022-4.92.143-1.998z"
        ></path>
      </svg>
    );
  },
};
