import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { getShareOptions } from 'views/components/ShareSection/getShareOptions';
import './ShareSection.scss';

type ShareSectionProps = {
  permalink: string;
};

export const ShareSection = (props: ShareSectionProps) => {
  const { permalink } = props;

  const shareOptions = getShareOptions(permalink);

  return (
    <div className="ShareSection">
      <CWText fontWeight="bold">Share to</CWText>
      <div className="share-options">
        {shareOptions.map((option) => (
          <div
            key={option.name}
            className="share-option"
            onClick={option.onClick}
          >
            <img src={option.icon} alt={option.name} className="icon" />
            <CWText type="caption">{option.name}</CWText>
          </div>
        ))}
      </div>
    </div>
  );
};
