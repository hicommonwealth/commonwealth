import { isBoolean, isNotNil } from 'helpers/typeGuards';

import breakpoints from '../../../styles/mixins/breakpoints.module.scss';

export const getClasses = <T>(
  styleAttrs: T,
  componentType?: string,
): string => {
  const type = isNotNil(componentType) ? [componentType] : [];
  // @ts-expect-error StrictNullChecks
  const classes = Object.entries(styleAttrs)
    .filter(
      // filter out keys with undefined values
      // filter out false bools since we only want the class if true
      ([key, value]) => isNotNil(key) && isNotNil(value) && value !== false,
    )
    // return the key if value is bool, otherwise return value
    .map(([key, value]) => (isBoolean(value) ? key : value));

  // @ts-expect-error StrictNullChecks
  return type.concat(classes).join(' ');
};

export const isWindowLarge = (width: number) =>
  width > parseInt(breakpoints.breakpointLargeMin);

export const isWindowMediumInclusive = (width: number) =>
  width < parseInt(breakpoints.breakpointMediumMax);

export const isWindowMedium = (width: number) =>
  width < parseInt(breakpoints.breakpointMediumMax) &&
  width > parseInt(breakpoints.breakpointMediumMin);

export const isWindowMediumSmallInclusive = (width: number) =>
  width < parseInt(breakpoints.breakpointMediumSmallMax);

export const isWindowMediumSmall = (width: number) =>
  width < parseInt(breakpoints.breakpointMediumSmallMax) &&
  width > parseInt(breakpoints.breakpointMediumSmallMin);

export const isWindowSmallInclusive = (width: number) =>
  width < parseInt(breakpoints.breakpointSmallMax);

export const isWindowSmall = (width: number) =>
  width < parseInt(breakpoints.breakpointSmallMax) &&
  width > parseInt(breakpoints.breakpointSmallMin);

export const isWindowExtraSmall = (width: number) =>
  width < parseInt(breakpoints.breakpointExtraSmallMax);

export const isWindowSmallToMedium = (width: number) =>
  width < parseInt(breakpoints.breakpointmediummaxNew) &&
  width > parseInt(breakpoints.breakpointsmallmaxNew);

export const isWindowSmallToMediumInclusive = (width: number) =>
  width < parseInt(breakpoints.breakpointSmallMaxNew);

export const breakpointFnValidator = (
  widthState: boolean,
  setWidthState: (state: boolean) => void,
  breakpointFn: (width: number) => boolean,
) => {
  const breakPointState = breakpointFn(window.innerWidth);

  if (widthState !== breakPointState) {
    setWidthState(breakPointState);
  }
};
