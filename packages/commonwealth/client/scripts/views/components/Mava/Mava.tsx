import { memo, useEffect, useRef } from 'react';
import app from 'state';

// eslint-disable-next-line no-var
declare var window: any;

export default memo(function Mava() {
  const initializedRef = useRef(false);

  const userId = app.user.id;
  const email = app.user.email;

  useEffect(() => {
    if (window.Mava) {
      if (!initializedRef.current) {
        console.log('Initializing Mava');
        window.Mava.initialize();
        initializedRef.current = true;
      }
      if (userId > 0) {
        window.Mava.identify({
          emailAddress: email,
          'User Id': userId,
        });

        console.log('Identified with mava.');
      }
    } else {
      console.warn('No mava');
    }
  }, [email, userId]);

  return null;
});
