import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { FloatingActionButton } from 'views/components/FloatingActionButton';
import { useQuickPostButtonActivated } from 'views/components/MobileNavigation/useQuickPostButtonActivated';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const QuickPostButton = () => {
  const navigate = useCommonNavigate();

  const activated = useQuickPostButtonActivated();

  const handleFab = () => {
    navigate('/new/discussion');
  };

  if (!activated) {
    return null;
  }

  return (
    <FloatingActionButton onClick={handleFab}>
      <CWIcon iconName="plus" />
    </FloatingActionButton>
  );
};
