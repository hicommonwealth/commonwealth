import { memo, useCallback, useEffect, useRef } from 'react';
import app from 'state';
import { isWindowSmall } from 'views/components/component_kit/helpers';
import './Mava.scss';

// eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
declare var window: any;

const mobile = isWindowSmall(window.innerWidth);

export const Mava = memo(function Mava() {
  const initializedRef = useRef(false);

  const userId = app.user.id;
  const email = app.user.email;

  const activateMava = useCallback(() => {
    const chatElement = document.getElementById('mava');
    if (chatElement) {
      chatElement.style.display = 'block';
    }
  }, []);

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

        if (!mobile) {
          activateMava();
        }

        console.log('Identified with mava.');
      }
    } else {
      console.warn('No mava');
    }
  }, [email, userId, activateMava]);

  return null;
});
