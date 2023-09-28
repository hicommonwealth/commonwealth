import { isBoolean, isNotNil } from 'helpers/typeGuards';

import breakpoints from '../../../../styles/mixins/breakpoints.scss';

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

export const isWindowLarge = (width: number) =>
  width > breakpoints.breakpointLargeM;

export const isWindowMediumInclusive = (width: number) =>
  width < breakpoints.breakpointMediumMax;

export const isWindowMedium = (width: number) =>
  width < breakpoints.breakpointMediumMax &&
  width > breakpoints.breakpointMediumMin;

export const isWindowMediumSmallInclusive = (width: number) =>
  width < breakpoints.breakpointMediumSmallMax;

export const isWindowMediumSmall = (width: number) =>
  width < breakpoints.breakpointMediumSmallMax &&
  width > breakpoints.breakpointMediumSmallMin;

export const isWindowSmallInclusive = (width: number) =>
  width < breakpoints.breakpointSmallMax;

export const isWindowSmall = (width: number) =>
  width < breakpoints.breakpointSmallMax &&
  width > breakpoints.breakpointSmallMin;

export const isWindowExtraSmall = (width: number) =>
  width < breakpoints.breakpointExtraSmallMax;

export const breakpointFnValidator = (
  widthState: boolean,
  setWidthState: (state: boolean) => void,
  breakpointFn: (width: number) => boolean
) => {
  const breakPointState = breakpointFn(window.innerWidth);

  if (widthState !== breakPointState) {
    setWidthState(breakPointState);
  }
};
