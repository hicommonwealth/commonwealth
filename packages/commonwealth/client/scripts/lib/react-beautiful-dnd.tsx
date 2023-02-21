import React, { useEffect, useState } from 'react';
import type { DroppableProps } from 'react-beautiful-dnd';
import { Droppable } from 'react-beautiful-dnd';

// We need this wrapper to be able to retain StrictMode
// https://github.com/atlassian/react-beautiful-dnd/issues/2399
export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));

    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};
