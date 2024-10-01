import React, {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IndicatorRight } from 'views/components/ScrollContainer/IndicatorRight';
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

        // the scroll left can be a fractional pixel so sometimes the difference is off
        // by one pixel, so we try to accept that as well
        setScrollActiveRight(
          el.scrollWidth - Math.floor(el.scrollLeft + el.clientWidth) > 1,
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

  console.log('FIXME: scrollActiveRight: ', scrollActiveRight);

  return (
    <div className="ScrollContainer">
      {scrollActiveLeft && (
        <div
          className="OverflowIndicator OverflowIndicatorLeft"
          {...indicatorProps}
        >
          &nbsp;
        </div>
      )}

      <div className="Inner" onScroll={handleRenderUpdate} ref={handleRef}>
        {props.children}
      </div>

      {scrollActiveRight && <IndicatorRight {...indicatorProps} />}
    </div>
  );
});
