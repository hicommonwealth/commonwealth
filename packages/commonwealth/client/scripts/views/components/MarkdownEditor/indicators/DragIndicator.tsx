import React from 'react';

import { Indicator } from 'views/components/MarkdownEditor/indicators/Indicator';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const DragIndicator = () => {
  return (
    <Indicator>
      <CWIcon iconName="cloudArrowUp" iconSize="xxl" />
    </Indicator>
  );
};
