import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { ShareOptionComponent } from 'views/components/ShareSection/ShareOptionComponent';
import { useShareOptions } from 'views/components/ShareSection/useShareOptions';
import './ShareSection.scss';

export type ShareSectionProps = {
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

  const block0 = shareOptions.slice(0, 5);
  const block1 = shareOptions.slice(5, 9);

  return (
    <div className="ShareSection">
      <CWText fontWeight="bold">Share to</CWText>
      <div className="share-options">
        {block0.map((option, idx) => (
          <ShareOptionComponent key={idx} {...option} />
        ))}
      </div>
      <div className="share-options">
        {block1.map((option, idx) => (
          <ShareOptionComponent key={idx} {...option} />
        ))}
      </div>
    </div>
  );
};
