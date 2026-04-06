import { useLocation } from 'react-router-dom';

export const useShowImage = () => {
  const location = useLocation();
  const showImageRoutes = ['/for-you', '/global'];

  return showImageRoutes.some((route) => location.pathname.includes(route));
};
