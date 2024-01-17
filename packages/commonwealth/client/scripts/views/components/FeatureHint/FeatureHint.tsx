import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import './FeatureHint.scss';

interface FeatureHintProps {
  title: string;
  hint: string;
}

const FeatureHint = ({ title, hint }: FeatureHintProps) => {
  return (
    <div className="FeatureHint">
      <div className="title-row">
        <CWIcon iconName="lightbulb" />
        <CWText fontWeight="medium">{title}</CWText>
      </div>
      <CWText className="hint">{hint}</CWText>
    </div>
  );
};

export default FeatureHint;
