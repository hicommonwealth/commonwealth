import { useEffect, useState } from 'react';
import app from 'state';

const useUserActiveAccount = () => {
  const [activeAccount, setActiveAccount] = useState(app.user.activeAccount);

  const updateActiveAccount = () => setActiveAccount(app.user.activeAccount);

  useEffect(() => {
    app.user.isFetched.on('redraw', updateActiveAccount);

    return () => {
      app.user.isFetched.off('redraw', updateActiveAccount);
    };
  }, []);

  return { activeAccount };
};

export default useUserActiveAccount;
