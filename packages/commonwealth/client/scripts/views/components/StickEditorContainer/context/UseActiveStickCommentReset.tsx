import { useCallback } from 'react';
import { useActivatorContext } from 'views/components/StickEditorContainer/context/UseActivatorContext';

export function useActiveStickCommentReset() {
  const activatorContext = useActivatorContext();

  return useCallback(() => {
    activatorContext.setActiveElement(null);
  }, [activatorContext]);
}
