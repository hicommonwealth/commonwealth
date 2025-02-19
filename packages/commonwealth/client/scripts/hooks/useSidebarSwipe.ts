import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useSidebarStore from 'state/ui/sidebar';

const useSidebarSwipe = () => {
  const { menuVisible, setMenu } = useSidebarStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [left, setLeft] = useState('0px');

  const isBackNavigationEnabled = (pathname) => {
    return (
      /^\/[^/]+\/discussion\/[^/]+$/.test(pathname) ||
      /^\/[^/]+\/snapshot\/[^/]+\/[^/]+$/.test(pathname) ||
      /^\/[^/]+\/proposal\/[^/]+$/.test(pathname)
    );
  };
  useEffect(() => {
    const shouldTriggerBack = isBackNavigationEnabled(location.pathname);
    const screenWidth = window.innerWidth;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX) return;

      const touchCurrentX = e.touches[0].clientX;
      const swipeDistance = touchCurrentX - touchStartX;

      if (menuVisible) {
        if (swipeDistance < 0) {
          const newLeft = Math.max(-100, (swipeDistance / screenWidth) * 100);
          setLeft(`${newLeft}%`);
        }
      } else {
        if (swipeDistance > 0 && !shouldTriggerBack) {
          const newLeft = Math.min(
            0,
            ((swipeDistance - screenWidth) / screenWidth) * 100,
          );
          setLeft(`${newLeft}%`);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX) return;

      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;
      const swipeThreshold = screenWidth * 0.3; // 30% of screen width

      if (menuVisible) {
        if (Math.abs(swipeDistance) > swipeThreshold && swipeDistance < 0) {
          setMenu({ name: 'default', isVisible: false });
          setLeft('0px');
        } else {
          setLeft('0px');
        }
      } else {
        if (
          Math.abs(swipeDistance) > swipeThreshold &&
          swipeDistance > 0 &&
          !shouldTriggerBack
        ) {
          setMenu({ name: 'default', isVisible: true });
          setLeft('0');
        } else if (shouldTriggerBack && swipeDistance > swipeThreshold) {
          navigate(-1);
        } else {
          setLeft('0px');
        }
      }
      setTouchStartX(null);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStartX, location.pathname, navigate, menuVisible, setMenu]);

  return left;
};

export default useSidebarSwipe;
