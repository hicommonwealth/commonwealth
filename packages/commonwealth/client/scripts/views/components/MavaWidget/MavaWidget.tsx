import { memo, useEffect } from 'react';

export default memo(function MavaWidget() {
  useEffect(() => {
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
  }, []);

  return null;
});
