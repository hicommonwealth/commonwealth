import { createContext } from 'react';
import { Activator } from 'views/components/StickEditorContainer/context/Activator';

const NULL_FUNCTION = () => {};

export const ActivatorContext = createContext<Activator>({
  defaultElement: null,
  activeElement: null,
  setDefaultElement: NULL_FUNCTION,
  setActiveElement: NULL_FUNCTION,
});
