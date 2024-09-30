import React, {
  memo,
  ReactNode,
  useCallback,
  useEffect,
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

  const handleRenderUpdate = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      console.log('FIXME: scroll: ', {
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });

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

  console.log('FIXME: ', { scrollActiveLeft, scrollActiveRight });

  return (
    <div className="ScrollContainer">
      {scrollActiveLeft && <div className="OverflowIndicatorLeft">&nbsp;</div>}

      <div className="Inner" onScroll={handleRenderUpdate} ref={handleRef}>
        {props.children}
      </div>

      {scrollActiveRight && (
        <div className="OverflowIndicatorRight">&nbsp;</div>
      )}
    </div>
  );
});
