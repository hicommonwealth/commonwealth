import React from 'react';

import { notifySuccess } from 'controllers/app/notifications';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';

const ElevationsShowcase = () => {
  return (
    <>
      <CWCard
        elevation="elevation-1"
        interactive
        onClick={() => notifySuccess('Card clicked!')}
      >
        <CWText fontWeight="semiBold">Card title</CWText>
        <CWText>Elevation: 1</CWText>
      </CWCard>
      <CWCard
        elevation="elevation-2"
        interactive
        onClick={() => notifySuccess('Card clicked!')}
      >
        <CWText fontWeight="semiBold">Card title</CWText>
        <CWText>Elevation: 2</CWText>
      </CWCard>
    </>
  );
};

export default ElevationsShowcase;
