import React, { useCallback, useRef } from 'react';

export const FakeEditor = () => {
  const focusRef = useRef(false);

  const handleMouseEvent = useCallback(
    (event: React.MouseEvent | React.UIEvent) => {
      if (!focusRef.current) {
        return false;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    [],
  );

  const handleFocus = useCallback(() => {
    focusRef.current = true;
  }, []);

  return (
    <div
      onMouseUp={handleMouseEvent}
      onMouseDown={handleMouseEvent}
      onPointerUp={handleMouseEvent}
      onPointerDown={handleMouseEvent}
      onMouseUpCapture={handleMouseEvent}
      onMouseDownCapture={handleMouseEvent}
      onPointerUpCapture={handleMouseEvent}
      onPointerDownCapture={handleMouseEvent}
      onWheel={handleMouseEvent}
      onWheelCapture={handleMouseEvent}
      onScroll={handleMouseEvent}
      onScrollCapture={handleMouseEvent}
    >
      <div
        onFocus={handleFocus}
        contentEditable={true}
        autoFocus={true}
        style={{
          backgroundColor: 'lightblue',
          height: '200px',
          width: '100vw',
        }}
      >
        Hello World
      </div>
      <div
        style={{
          padding: '5px',
          backgroundColor: 'lightpink',
          height: '75px',
          pointerEvents: 'none',
        }}
      >
        fake toolbar
      </div>
    </div>
  );
};
