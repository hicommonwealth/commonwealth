import { createContext } from 'react';

type LayoutContextProps = {
  onRerender: () => void;
  renderKey?: string;
};

const initialValues = {
  onRerender: () => {},
  renderKey: '',
};

export const LayoutContext = createContext<LayoutContextProps>(initialValues);
