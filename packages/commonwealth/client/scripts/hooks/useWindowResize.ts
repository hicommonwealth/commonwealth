import useBrowserWindow from 'hooks/useBrowserWindow';
import { useCallback, useEffect, useState } from 'react';

const useWindowResize = ({ setMenu }) => {
  const [resizing, setResizing] = useState(false);
  const { isWindowSmallInclusive } = useBrowserWindow({
    onResize: () => setResizing(true),
    resizeListenerUpdateDeps: [resizing],
  });
  const [toggleMobileView, setToggleMobileView] = useState(
    (location.pathname.includes('discussions') ||
      location.pathname.includes('search')) &&
      isWindowSmallInclusive,
  );

  const onWindowResize = useCallback(() => {
    setMenu({ name: 'default', isVisible: !isWindowSmallInclusive });
    setToggleMobileView(
      (location.pathname.includes('discussions') ||
        location.pathname.includes('search')) &&
        isWindowSmallInclusive,
    );
  }, [isWindowSmallInclusive, setMenu, setToggleMobileView]);

  useEffect(() => {
    onWindowResize();
    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, [onWindowResize]);

  return { toggleMobileView, onWindowResize };
};

export default useWindowResize;
