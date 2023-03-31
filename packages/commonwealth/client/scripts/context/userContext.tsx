import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import app from 'state';

const UserContext = createContext<{ isLoggedIn: boolean }>({
  isLoggedIn: app.isLoggedIn(),
});

export const UserProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(app.isLoggedIn());

  useEffect(() => {
    app.loginStateEmitter.on('redraw', () => {
      setIsLoggedIn(app.isLoggedIn());
    });

    return () => {
      app.loginStateEmitter.removeAllListeners();
    };
  }, [isLoggedIn]);

  const value = useMemo(() => ({ isLoggedIn }), [isLoggedIn]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
};
