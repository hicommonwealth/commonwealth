import { ReactNode } from 'react';

export interface ShareOption {
  name: string;
  icon: string | ReactNode;
  requiresMobile?: boolean;
  onClick: () => void;
}
