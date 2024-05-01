import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useState } from 'react';

interface useAnimationProps {
  transitionDuration?: string;
}

export const useAnimation = ({
  transitionDuration = '1s',
}: useAnimationProps = {}) => {
  const [animationStyles, setAnimationStyles] = useState({
    opacity: 0,
    transform: 'translateY(100%)',
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
