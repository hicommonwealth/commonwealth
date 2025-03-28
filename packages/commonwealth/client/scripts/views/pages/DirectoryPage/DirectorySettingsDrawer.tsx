import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import './DirectorySettingsDrawer.scss';

type DirectorySettingsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DirectorySettingsDrawer = ({
  isOpen,
  onClose,
}: DirectorySettingsDrawerProps) => {
  return (
    <div className="DirectorySettingsDrawer">
      <CWDrawer className="directory-settings-drawer" open={isOpen}>
        <CWDrawerTopBar onClose={() => onClose()} />
        <div className="content-container">
          <CWText>Directory Settings</CWText>
        </div>
      </CWDrawer>
    </div>
  );
};

export default DirectorySettingsDrawer;
