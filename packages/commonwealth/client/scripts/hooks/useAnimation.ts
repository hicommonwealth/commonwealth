import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useState } from 'react';

interface useAnimationProps {
  transitionDuration?: string;
  transformNumber?: string;
}

export const useAnimation = ({
  transitionDuration = '1s',
  transformNumber = 'translateY(40px)',
}: useAnimationProps = {}) => {
  const [animationStyles, setAnimationStyles] = useState({
    opacity: 0,
    transform: transformNumber,
    transition: transitionDuration,
  });

  useNecessaryEffect(() => {
    setAnimationStyles({
      opacity: 1,
      transform: 'translateY(0)',
      transition: transitionDuration,
    });
  }, []);

  return { animationStyles };
};
