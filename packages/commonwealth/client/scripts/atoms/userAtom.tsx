import React, { useEffect } from 'react';
import app from 'state';
import { atom, useAtom, useAtomValue } from 'jotai';

const userAtom = atom({
  isLoggedIn: app.isLoggedIn(),
});

export const UserProvider = ({ children }) => {
  const [userState, setUserState] = useAtom(userAtom);

  useEffect(() => {
    const updateLoggedInState = () => {
      console.log('updating logged in state', userAtom);
      setUserState({ isLoggedIn: app.isLoggedIn() });
    }

    app.loginStateEmitter.on('redraw', updateLoggedInState);

    return () => {
      app.loginStateEmitter.removeListener('redraw', updateLoggedInState);
    };
  }, [userState, setUserState]);

  return <>{children}</>;
};

export const useUser = () => {
  console.log('accessing user state', userAtom);
  const userState = useAtomValue(userAtom);

  if (userState === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return userState;
};