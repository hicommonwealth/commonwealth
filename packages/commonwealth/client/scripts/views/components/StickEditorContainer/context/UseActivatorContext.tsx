import { useContext } from 'react';
import { ActivatorContext } from 'views/components/StickEditorContainer/context/ActivatorContext';

export function useActivatorContext() {
  return useContext(ActivatorContext);
}
