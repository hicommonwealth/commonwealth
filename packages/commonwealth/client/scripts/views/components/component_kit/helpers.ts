import breakpoints from 'mixins/breakpoints.scss';

import { isBoolean, isNotNil } from 'helpers/typeGuards';

export const getClasses = <T>(
  styleAttrs: T,
  componentType?: string
): string => {
  const type = isNotNil(componentType) ? [componentType] : [];
  const classes = Object.entries(styleAttrs)
    .filter(
      // filter out keys with undefined values
      // filter out false bools since we only want the class if true
      ([key, value]) => isNotNil(key) && isNotNil(value) && value !== false
    )
    // return the key if value is bool, otherwise return value
    .map(([key, value]) => (isBoolean(value) ? key : value));

  return type.concat(classes).join(' ');
};

export const isWindowLarge = window.matchMedia(
  `(min-width: ${breakpoints.breakpointLargeMinPx})`
).matches;

export const isWindowMediumInclusive = window.matchMedia(
  `(max-width: ${breakpoints.breakpointMediumMaxPx})`
).matches;

export const isWindowMedium =
  window.matchMedia(`(max-width: ${breakpoints.breakpointMediumMaxPx})`)
    .matches &&
  window.matchMedia(`(min-width: ${breakpoints.breakpointMediumMinPx})`)
    .matches;

export const isWindowMediumSmallInclusive = window.matchMedia(
  `(max-width: ${breakpoints.breakpointMediumSmallMaxPx})`
).matches;

export const isWindowMediumSmall =
  window.matchMedia(`(max-width: ${breakpoints.breakpointMediumSmallMaxPx})`)
    .matches &&
  window.matchMedia(`(min-width: ${breakpoints.breakpointMediumSmallMinPx})`)
    .matches;

export const isWindowSmallInclusive = window.matchMedia(
  `(max-width: ${breakpoints.breakpointSmallMaxPx})`
).matches;

export const isWindowSmall =
  window.matchMedia(`(max-width: ${breakpoints.breakpointSmallMaxPx})`)
    .matches &&
  window.matchMedia(`(min-width: ${breakpoints.breakpointSmallMinPx})`).matches;

export const isWindowExtraSmall = window.matchMedia(
  `(max-width: ${breakpoints.breakpointExtraSmallMaxPx})`
).matches;
