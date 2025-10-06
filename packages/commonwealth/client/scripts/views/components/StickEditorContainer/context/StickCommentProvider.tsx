import React, {
  ReactNode,
  createContext,
  memo,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ActivatorContext } from './ActivatorContext';

export type EditorMode = 'thread' | 'comment';

interface StickCommentContextType {
  mode: EditorMode;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  defaultElement: ReactNode | null;
  setDefaultElement: (element: ReactNode | null) => void;
  activeElement: ReactNode | null;
  setActiveElement: (element: ReactNode | null) => void;
}

export const StickCommentContext = createContext<StickCommentContextType>({
  mode: 'comment',
  isExpanded: false,
  setIsExpanded: () => {},
  defaultElement: null,
  setDefaultElement: () => {},
  activeElement: null,
  setActiveElement: () => {},
});

export const useStickComment = () => useContext(StickCommentContext);

type Props = {
  children: ReactNode;
  mode?: EditorMode;
};

/**
 * The provider which has to wrap our entire comment reply system.
 */
export const StickCommentProvider = memo(function StickCommentProvider({
  children,
  mode = 'comment',
}: Props) {
  const [defaultElement, setDefaultElement] = useState<ReactNode | null>(null);
  const [activeElement, setActiveElement] = useState<ReactNode | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const stickCommentValue = useMemo(
    () => ({
      mode,
      isExpanded,
      setIsExpanded,
      defaultElement,
      setDefaultElement,
      activeElement,
      setActiveElement,
    }),
    [mode, isExpanded, defaultElement, activeElement],
  );

  const activatorValue = useMemo(
    () => ({
      defaultElement,
      setDefaultElement,
      activeElement,
      setActiveElement,
    }),
    [defaultElement, activeElement],
  );

  return (
    <StickCommentContext.Provider value={stickCommentValue}>
      <ActivatorContext.Provider value={activatorValue}>
        {children}
      </ActivatorContext.Provider>
    </StickCommentContext.Provider>
  );
});
