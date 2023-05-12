import { createContext } from 'react';

type LayoutContextProps = {
  reRenderLayout?: () => void;
};

export const LayoutContext = createContext<LayoutContextProps>(null);
