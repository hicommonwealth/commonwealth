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
);

export const isWindowMediumMax = window.matchMedia(
  `(max-width: ${breakpoints.breakpointMediumMaxPx})`
);

export const isWindowMediumMin = window.matchMedia(
  `(min-width: ${breakpoints.breakpointMediumMinPx})`
);

export const isWindowMediumSmallMax = window.matchMedia(
  `(max-width: ${breakpoints.breakpointMediumSmallMaxPx})`
);

export const isWindowMediumSmallMin = window.matchMedia(
  `(min-width: ${breakpoints.breakpointMediumSmallMinPx})`
);

export const isWindowSmallMax = window.matchMedia(
  `(max-width: ${breakpoints.breakpointSmallMaxPx})`
);

export const isWindowSmallMin = window.matchMedia(
  `(min-width: ${breakpoints.breakpointSmallMinPx})`
);

export const isWindowExtraSmallMax = window.matchMedia(
  `(max-width: ${breakpoints.breakpointExtraSmallMaxPx})`
);
