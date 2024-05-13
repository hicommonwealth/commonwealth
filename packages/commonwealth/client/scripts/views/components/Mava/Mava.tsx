import { memo, useEffect, useRef } from 'react';
import app from 'state';

// eslint-disable-next-line no-var
declare var window: any;

export default memo(function Mava() {
  const initializedRef = useRef(false);

  const email = app.user.email;

  useEffect(() => {
    if (window.Mava) {
      if (!initializedRef.current) {
        console.log('Initializing Mava');
        window.Mava.initialize();
        initializedRef.current = true;
      }

      console.log('Identify with mava: ' + email);

      if (email && email !== '') {
        window.Mava.identify({
          emailAddress: email,
        });
      }
    }
  }, [email]);

  return null;
});
