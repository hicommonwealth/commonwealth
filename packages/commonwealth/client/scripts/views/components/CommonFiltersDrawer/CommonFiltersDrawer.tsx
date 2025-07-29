import clsx from 'clsx';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';

export type CommonFiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const CommonFiltersDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}: CommonFiltersDrawerProps) => (
  <div className={clsx('FiltersDrawer', className)}>
    <CWDrawer
      overlayOpacity={0}
      className="filter-drawer"
      open={isOpen}
      onClose={onClose}
    >
      <CWDrawerTopBar onClose={onClose} />
      <div className="content-container">
        <CWText type="h3">{title}</CWText>
        <div className="filter-content">{children}</div>
      </div>
    </CWDrawer>
  </div>
);
