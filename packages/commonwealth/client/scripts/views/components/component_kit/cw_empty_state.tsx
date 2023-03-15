import React from 'react';

import 'components/component_kit/cw_empty_state.scss';
import m from 'mithril';

import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';

type EmptyStateProps = {
  content: string | React.ReactNode;
  iconName?: IconName;
};

export const CWEmptyState = (props: EmptyStateProps) => {
  const { content, iconName } = props;

  return (
    <div className="EmptyState">
      <div className="inner-content">
        <CWIcon iconName={iconName} iconSize="xl" />
        {typeof content === 'string' ? <CWText>{content}</CWText> : content}
      </div>
    </div>
  );
};
