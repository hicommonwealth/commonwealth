import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import './CreateCommunityHint.scss';

interface CreateCommunityHintProps {
  title: string;
  hint: string;
}

const CreateCommunityHint = ({ title, hint }: CreateCommunityHintProps) => {
  return (
    <div className="CreateCommunityHint">
      <div className="title-row">
        <CWIcon iconName="lightbulb" />
        <CWText fontWeight="medium">{title}</CWText>
      </div>
      <CWText className="hint">{hint}</CWText>
    </div>
  );
};

export default CreateCommunityHint;
