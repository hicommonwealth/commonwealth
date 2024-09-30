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

  const [scrollActive, setScrollActive] = useState(false);

  const handleRenderUpdate = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      console.log('FIXME: clientWidth: ', el.clientWidth);
      console.log('FIXME: scrollWidth: ', el.scrollWidth);

      setScrollActive(el.clientWidth < el.scrollWidth);
    }
  }, []);

  const handleRef = useCallback(
    (element: HTMLElement | null) => {
      containerRef.current = element;
      handleRenderUpdate();
      element?.addEventListener('scroll', () => console.log('FIXME scroll'));
    },
    [handleRenderUpdate],
  );

  useEffect(() => {
    window.addEventListener('resize', handleRenderUpdate);

    return () => {
      window.removeEventListener('resize', handleRenderUpdate);
    };
  }, [handleRenderUpdate]);

  return (
    <div className="ScrollContainer" ref={handleRef}>
      {props.children}

      {scrollActive && <div className="OverflowIndicatorRight">&nbsp;</div>}
    </div>
  );
});
