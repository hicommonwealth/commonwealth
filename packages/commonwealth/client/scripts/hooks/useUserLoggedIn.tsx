import { useEffect, useState } from 'react';

import app from 'state';

const useUserLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(app.isLoggedIn());

  const updateIsLoggedIn = () => setIsLoggedIn(app.isLoggedIn());

  useEffect(() => {
    app.loginStateEmitter.on('redraw', updateIsLoggedIn);

    return () => {
      app.loginStateEmitter.off('redraw', updateIsLoggedIn);
    };
  }, []);

  return { isLoggedIn };
};

export default useUserLoggedIn;
