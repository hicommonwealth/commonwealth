import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import React, { ComponentProps, useState } from 'react';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import { CWIcon } from '../../cw_icons/cw_icon';
import './CWDrawer.scss';

type CWDrawerProps = Omit<ComponentProps<typeof Drawer>, 'direction'> & {
  direction?: 'left' | 'right' | 'top' | 'bottom';
};

export const CWDrawer = ({
  direction,
  duration,
  size,
  open,
  onClose,
  children,
}: CWDrawerProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});
  const [fullscreen, setFullscreen] = useState(false);

  const toggleDrawerFullscreen = () => {
    setFullscreen((prevState) => !prevState);
  };

  return (
    <Drawer
      duration={duration}
      size={isWindowExtraSmall || fullscreen ? '100vw' : size || '35%'}
      open={open}
      onClose={onClose}
      direction={direction || 'right'}
      enableOverlay={false}
    >
      <div>
        <CWIcon iconName="caretDoubleRight" onClick={onClose} />
        {!isWindowExtraSmall && (
          <CWIcon
            iconName={fullscreen ? 'arrowsInSimple' : 'arrowsOutSimple'}
            onClick={toggleDrawerFullscreen}
          />
        )}
      </div>
      {children}
    </Drawer>
  );
};
