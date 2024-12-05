import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { FloatingActionButton } from 'views/components/FloatingActionButton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const CreateFab = () => {
  const navigate = useCommonNavigate();
  const scopedPage = app.activeChainId();

  const handleFab = () => {
    // FIXME: if this is a scopedPage.. this will work..  otherwise we ahve to
    // pick a community first.
    navigate('/new/discussion');
  };

  return (
    <FloatingActionButton onClick={handleFab}>
      <CWIcon iconName="plus" />
    </FloatingActionButton>
  );
};
