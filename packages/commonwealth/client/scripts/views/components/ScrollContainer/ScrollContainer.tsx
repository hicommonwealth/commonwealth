import React, {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './ScrollContainer.scss';

type ScrollContainerProps = Readonly<{
  children: ReactNode;
}>;

export const ScrollContainer = memo(function ScrollContainer(
  props: ScrollContainerProps,
) {
  const containerRef = useRef<HTMLElement | null>();

  const [scrollActiveLeft, setScrollActiveLeft] = useState(false);
  const [scrollActiveRight, setScrollActiveRight] = useState(false);

  const [indicatorHeight, setIndicatorHeight] = useState(0);

  const handleRenderUpdate = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      setIndicatorHeight(el.clientHeight);

      if (el.clientWidth < el.scrollWidth) {
        setScrollActiveLeft(el.scrollLeft !== 0);
        setScrollActiveRight(
          Math.floor(el.scrollLeft + el.clientWidth) < el.scrollWidth,
        );
      } else {
        setScrollActiveRight(false);
      }
    }
  }, []);

  const handleRef = useCallback(
    (element: HTMLElement | null) => {
      containerRef.current = element;
      handleRenderUpdate();
    },
    [handleRenderUpdate],
  );

  useEffect(() => {
    window.addEventListener('resize', handleRenderUpdate);

    return () => {
      window.removeEventListener('resize', handleRenderUpdate);
    };
  }, [handleRenderUpdate]);

  const indicatorProps = useMemo(() => {
    return {
      style: {
        height: indicatorHeight,
      },
    };
  }, [indicatorHeight]);

  return (
    <div className="ScrollContainer">
      {scrollActiveLeft && (
        <div className="OverflowIndicatorLeft" {...indicatorProps}>
          &nbsp;
        </div>
      )}

      <div className="Inner" onScroll={handleRenderUpdate} ref={handleRef}>
        {props.children}
      </div>

      {scrollActiveRight && (
        <div className="OverflowIndicatorRight" {...indicatorProps}>
          &nbsp;
        </div>
      )}
    </div>
  );
});
