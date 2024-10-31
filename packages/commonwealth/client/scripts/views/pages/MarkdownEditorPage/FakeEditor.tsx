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

  const createMouseHandler = useCallback((eventName: string) => {
    return (event: React.MouseEvent | React.UIEvent) => {
      console.log('Got event: ' + eventName);
    };
  }, []);

  const handleFocus = useCallback(() => {
    focusRef.current = true;
  }, []);

  return (
    <div
      // onPointerDown={createMouseHandler('onPointerDown')}
      // onPointerUp={createMouseHandler('onPointerUp')}
      // onPointerMove={createMouseHandler('onPointerMove')}
      // onMouseDown={createMouseHandler('onMouseDown')}
      // onMouseUp={createMouseHandler('onMouseUp')}
      // onMouseMove={createMouseHandler('onMouseMove')}
      // onWheel={createMouseHandler('onWheel')}
      // onScroll={createMouseHandler('onScroll')}
      onMouseUp={handleMouseEvent}
      onMouseDown={handleMouseEvent}
      onMouseMove={handleMouseEvent}
      onPointerUp={handleMouseEvent}
      onPointerDown={handleMouseEvent}
      onPointerMove={handleMouseEvent}
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
      ></div>
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
