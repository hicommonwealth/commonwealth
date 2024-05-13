import { memo, useEffect, useRef } from 'react';

export default memo(function MavaWidget() {
  const initializedRef = useRef(false);

  // const mavaEnabled = useFlag('mavaEnabled');
  const mavaEnabled = true;
  useEffect(() => {
    if (!initializedRef.current) {
      if (mavaEnabled) {
        const script = document.createElement('script');
        script.setAttribute('defer', 'true');
        script.setAttribute('src', 'https://widget.mava.app');
        script.setAttribute('widget-version', 'v2');
        script.setAttribute('id', 'MavaWebChat');
        script.setAttribute('enable-sdk', 'true');
        script.setAttribute(
          'data-token',
          '28672714d1690a96717516beafd198d5dcacf85b19fde51e88b05ed8831640c9',
        );
        document.body.appendChild(script);
        initializedRef.current = true;
      } else {
        console.log('Skipping Mava - not enabled');
      }
    }
  }, [mavaEnabled]);

  return null;
});
