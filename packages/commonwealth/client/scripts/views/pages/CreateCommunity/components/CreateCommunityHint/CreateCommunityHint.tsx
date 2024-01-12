import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import clsx from 'clsx';
import './CreateCommunityHint.scss';

interface CreateCommunityHintProps {
  title: string;
  hint: string;
  className?: string;
}

const CreateCommunityHint = ({
  title,
  hint,
  className,
}: CreateCommunityHintProps) => {
  return (
    <div className={clsx('CreateCommunityHint', className)}>
      <div className="title-row">
        <CWIcon iconName="lightbulb" />
        <CWText fontWeight="medium">{title}</CWText>
      </div>
      <CWText className="hint">{hint}</CWText>
    </div>
  );
};

export default CreateCommunityHint;
