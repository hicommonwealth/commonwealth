import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import React, { ComponentProps, useState } from 'react';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import { CWIcon } from '../../cw_icons/cw_icon';
import { CWText } from '../../cw_text';
import { ComponentType } from '../../types';
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
  const [fullscreen, setFullscreen] = useState(false);

  const toggleDrawerFullscreen = () => {
    setFullscreen((prevState) => !prevState);
  };

  return (
    <Drawer
      duration={duration}
      size={fullscreen ? '100vw' : isWindowExtraSmall ? '90vw' : '50vw'}
      open={open}
      onClose={onClose}
      direction={direction || 'right'}
      enableOverlay={false}
      className={ComponentType.Drawer}
      style={{ top: '56px' }}
    >
      <div className="drawer-actions">
        <CWIcon
          iconName="caretDoubleRight"
          onClick={onClose}
          iconSize="small"
        />
        {!isWindowExtraSmall && (
          <CWIcon
            iconName={fullscreen ? 'arrowsInSimple' : 'arrowsOutSimple'}
            onClick={toggleDrawerFullscreen}
            iconSize="small"
          />
        )}
      </div>
      <div className="content-container">
        <CWText type="h3">{header}</CWText>
        {children}
      </div>
    </Drawer>
  );
};
