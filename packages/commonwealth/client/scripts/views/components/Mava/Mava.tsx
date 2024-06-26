import React, { memo, useCallback, useRef } from 'react';
import app from 'state';
import { isWindowSmallInclusive } from 'views/components/component_kit/helpers';
import './Mava.scss';

// eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
declare var window: any;

console.log('FIXME: window.innerWidth: ' + window.innerWidth);

const mobile = isWindowSmallInclusive(window.innerWidth);

export const Mava = memo(function Mava() {
  const initializedRef = useRef(false);

  const userId = app.user.id;
  const email = app.user.email;

  const activateMava = useCallback(() => {
    const chatElement = document.getElementById('mava');
    if (chatElement) {
      if (mobile) {
        console.log('FIXME 1');
        if (chatElement.firstElementChild) {
          console.log('FIXME 2', chatElement.firstElementChild);
          (chatElement.firstElementChild as HTMLElement).style.bottom = '75px';
        }
      }

      //chatElement.style.display = 'block'
    }
  }, []);
  //
  // useEffect(() => {
  //   if (window.Mava) {
  //     if (!initializedRef.current) {
  //       console.log('Initializing Mava');
  //       window.Mava.initialize();
  //       initializedRef.current = true;
  //     }
  //     if (userId > 0) {
  //       window.Mava.identify({
  //         emailAddress: email,
  //         'User Id': userId,
  //       });
  //
  //       activateMava();
  //
  //       console.log('Identified with mava.');
  //     }
  //   } else {
  //     console.warn('No mava');
  //   }
  // }, [email, userId, activateMava]);

  return (
    <div>
      <button
        id="mava-webchat-launcher"
        onClick={() => window.MavaWebChatToggle()}
      >
        click me
      </button>
      {/*> click me</button>*/}
    </div>
  );
});
