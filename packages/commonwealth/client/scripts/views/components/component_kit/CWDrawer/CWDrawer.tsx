import clsx from 'clsx';
import React, { ComponentProps } from 'react';
import Drawer from 'react-modern-drawer';

import useBrowserWindow from 'hooks/useBrowserWindow';

import { ComponentType } from '../../types';

import 'react-modern-drawer/dist/index.css';
import './CWDrawer.scss';

type CWDrawerProps = Omit<ComponentProps<typeof Drawer>, 'direction'> & {
  direction?: 'left' | 'right' | 'top' | 'bottom';
};

export const CWDrawer = ({
  direction = 'right',
  duration,
  open,
  onClose,
  children,
  className,
  size,
  overlayOpacity,
  ...props
}: CWDrawerProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});

  const sideDirection = direction === 'right' || direction === 'left';

  const getDrawerSize = () => {
    if (size) {
      return size;
    }

    if (sideDirection) {
      return isWindowExtraSmall ? '90vw' : '50vw';
    }

    if (direction === 'bottom') {
      return '50vh';
    }
  };

  return (
    <Drawer
      duration={duration}
      open={open}
      onClose={onClose}
      direction={direction}
      enableOverlay={true}
      overlayOpacity={overlayOpacity}
      className={clsx(ComponentType.Drawer, className, {
        'bottom-drawer': direction === 'bottom',
      })}
      size={getDrawerSize()}
      {...props}
    >
      {children}
    </Drawer>
  );
};
