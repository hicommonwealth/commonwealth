import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { useShareOptions } from 'views/components/ShareSection/useShareOptions';
import './ShareSection.scss';

type ShareSectionProps = {
  url: string;
  title?: string;
  text?: string;
};

/**
 * Create a share section for sharing content.
 *
 * Title and text are only supported on certain providers.
 */
export const ShareSection = (props: ShareSectionProps) => {
  const { url, title, text } = props;

  const shareOptions = useShareOptions(url, title, text);

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
            {typeof option.icon === 'string' && (
              <img src={option.icon} alt={option.name} className="icon" />
            )}

            {typeof option.icon !== 'string' && <>{option.icon}</>}

            <CWText type="caption">{option.name}</CWText>
          </div>
        ))}
      </div>
    </div>
  );
};
