import { useEffect, useMemo, useState } from 'react';
import {
  isWindowExtraSmall,
  isWindowLarge,
  isWindowMedium,
  isWindowMediumInclusive,
  isWindowMediumSmall,
  isWindowMediumSmallInclusive,
  isWindowSmall,
  isWindowSmallInclusive,
} from '../views/components/component_kit/helpers';

type IuseBrowserWindow = {
  onResize?: () => any;
  resizeListenerUpdateDeps?: any[];
};

const useBrowserWindow = ({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onResize = () => {},
  resizeListenerUpdateDeps = [],
}: IuseBrowserWindow) => {
  /**
   * Window size
   */
  const [windowSize, setWindowSize] = useState(window.innerWidth);
  const windowSizeBooleans = {
    isWindowExtraSmall: isWindowExtraSmall(windowSize),
    isWindowLarge: isWindowLarge(windowSize),
    isWindowMediumInclusive: isWindowMediumInclusive(windowSize),
    isWindowMedium: isWindowMedium(windowSize),
    isWindowMediumSmallInclusive: isWindowMediumSmallInclusive(windowSize),
    isWindowMediumSmall: isWindowMediumSmall(windowSize),
    isWindowSmallInclusive: isWindowSmallInclusive(windowSize), // We are using this one for mobile
    isWindowSmall: isWindowSmall(windowSize),
  };
  useEffect(() => {
    const _onResize = () => setWindowSize(window.innerWidth);
    window.addEventListener('resize', _onResize);

    return () => {
      window.removeEventListener('resize', _onResize);
    };
  }, []);

  const dependencyArray = useMemo(
    () => [...resizeListenerUpdateDeps],
    [resizeListenerUpdateDeps],
  );

  /**
   * Resize listener
   */
  useEffect(() => {
    // eslint-disable-next-line no-restricted-globals
    onResize && window.addEventListener('resize', onResize);

    return () => {
      // eslint-disable-next-line no-restricted-globals
      onResize && window.removeEventListener('resize', onResize);
    };
  }, [onResize, dependencyArray]);

  return {
    // window sizes
    ...windowSizeBooleans,
  };
};

export default useBrowserWindow;
