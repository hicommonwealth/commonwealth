import clsx from 'clsx';
import React, { ComponentProps } from 'react';
import Drawer from 'react-modern-drawer';

import useBrowserWindow from 'hooks/useBrowserWindow';

import { CWText } from '../../cw_text';
import { ComponentType } from '../../types';
import CWIconButton from '../CWIconButton';

import 'react-modern-drawer/dist/index.css';
import './CWDrawer.scss';

type CWDrawerProps = Omit<ComponentProps<typeof Drawer>, 'direction'> & {
  direction?: 'left' | 'right' | 'top' | 'bottom';
  header?: string;
};

export const CWDrawer = ({
  direction = 'right',
  duration,
  open,
  onClose,
  children,
  header,
  className,
  size,
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
      overlayOpacity={0}
      className={clsx(ComponentType.Drawer, className, {
        'bottom-drawer': direction === 'bottom',
      })}
      size={getDrawerSize()}
      {...props}
    >
      {sideDirection ? (
        <>
          <div className="drawer-actions">
            <CWIconButton
              iconName="caretDoubleRight"
              onClick={onClose}
              buttonSize="sm"
            />
          </div>
          <div className="content-container">
            <CWText type="h3">{header}</CWText>
            {children}
          </div>
        </>
      ) : (
        children
      )}
    </Drawer>
  );
};
