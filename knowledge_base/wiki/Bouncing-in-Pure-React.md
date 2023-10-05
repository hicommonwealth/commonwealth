```javascript
// Bouncing Ball

import React, { useState, useEffect } from 'react';

function BounceBall() {
  const [position, setPosition] = useState(0);
  const [velocity, setVelocity] = useState(1);
  const [min, max] = [0, 100];

  useEffect(() => {
    if (position <= min || position >= max) {
      setVelocity(-velocity);
    }
    setPosition(position + velocity);
  }, [position, velocity]);

  const style = {
    position: 'absolute',
    top: `${position}px`
  };

  return <div style={style}>Bounce Ball</div>;
}
```