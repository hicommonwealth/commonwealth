import React from 'react';

import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';

import './CWDrawerTopBar.scss';

interface CWDrawerTopBarProps {
  onClose: () => void;
}

const CWDrawerTopBar = ({ onClose }: CWDrawerTopBarProps) => {
  return (
    <div className="DrawerTopBar">
      <CWIconButton
        iconName="caretDoubleRight"
        onClick={onClose}
        buttonSize="sm"
      />
    </div>
  );
};

export default CWDrawerTopBar;
