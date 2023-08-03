import { useEffect } from 'react';

export const useSwipe = ({ onLeftSwipe, onRightSwipe, threshold }) => {
  let touchStartX = 0;
  let touchEndX = 0;

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
      touchEndX = e.changedTouches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      const swipeLength = Math.abs(touchStartX - touchEndX);

      if (swipeLength >= threshold) {
        if (touchEndX < touchStartX) {
          onLeftSwipe();
        } else {
          onRightSwipe();
        }
      }

      touchStartX = 0;
      touchEndX = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onLeftSwipe, onRightSwipe, threshold]);

  return {};
};

export default useSwipe;
