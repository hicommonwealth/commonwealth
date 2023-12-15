import { useEffect, useState } from 'react';

export const useAnimation = () => {
  const [animationStyles, setAnimationStyles] = useState({
    opacity: 0,
    transform: 'translateY(40px)',
    transition: '1s',
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAnimationStyles({
        opacity: 1,
        transform: 'translateY(0)',
        transition: '1s',
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return { animationStyles };
};
