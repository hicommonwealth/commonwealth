import { createContext } from 'react';

type LayoutContextProps = {
  reRenderLayout: () => void;
};

const initialValues = {
  reRenderLayout: () => {},
};

export const LayoutContext = createContext<LayoutContextProps>(initialValues);
