import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useState } from 'react';

export const useAnimation = () => {
  const [animationStyles, setAnimationStyles] = useState({
    opacity: 0,
    transform: 'translateY(40px)',
    transition: '1s',
  });

  useNecessaryEffect(() => {
    setAnimationStyles({
      opacity: 1,
      transform: 'translateY(0)',
      transition: '1s',
    });
  }, []);

  return { animationStyles };
};
