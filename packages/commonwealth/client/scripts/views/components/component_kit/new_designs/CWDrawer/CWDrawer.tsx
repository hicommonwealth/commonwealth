import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import React, { ComponentProps } from 'react';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import { CWText } from '../../cw_text';
import { ComponentType } from '../../types';
import CWIconButton from '../CWIconButton';
import './CWDrawer.scss';

type CWDrawerProps = Omit<ComponentProps<typeof Drawer>, 'direction'> & {
  direction?: 'left' | 'right' | 'top' | 'bottom';
  header: string;
};

export const CWDrawer = ({
  direction,
  duration,
  open,
  onClose,
  children,
  header,
}: CWDrawerProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});

  return (
    <Drawer
      duration={duration}
      size={isWindowExtraSmall ? '90vw' : '50vw'}
      open={open}
      onClose={onClose}
      direction={direction || 'right'}
      enableOverlay={true}
      overlayOpacity={0}
      className={ComponentType.Drawer}
      // moves the drawer below the top navigation bar
      style={{ top: '56px' }}
    >
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
    </Drawer>
  );
};
