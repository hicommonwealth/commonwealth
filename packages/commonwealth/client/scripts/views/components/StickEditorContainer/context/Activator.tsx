import { ReactNode } from 'react';

export type Activator = {
  activeElement: ReactNode | null;
  defaultElement: ReactNode | null;
  setDefaultElement: (node: ReactNode) => void;
  setActiveElement: (node: ReactNode) => void;
};
