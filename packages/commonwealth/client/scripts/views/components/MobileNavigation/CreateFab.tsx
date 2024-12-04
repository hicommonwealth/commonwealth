import React from 'react';
import { FloatingActionButton } from 'views/components/FloatingActionButton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const CreateFab = () => {
  const handleFab = () => {
    console.log('FIXME :clicked fag');
  };

  return (
    <FloatingActionButton onClick={handleFab}>
      <CWIcon iconName="plus" />
    </FloatingActionButton>
  );
};
