import React, { useState } from 'react';

import 'pages/terms_banner.scss';

import app from 'state';
import { Old_CWBanner } from './component_kit/cw_banner';
import { CWText } from './component_kit/cw_text';

type TermsBannerProps = { terms: string };

export const TermsBanner = ({ terms }: TermsBannerProps) => {
  const localStorageId = `${app.activeChainId()}-tos`;

  const [isVisible, setIsVisible] = useState(
    localStorage.getItem(localStorageId)
  );

  const handleClickDismiss = () => {
    setIsVisible('off');
    localStorage.setItem(localStorageId, 'off');
  };

  if (isVisible === 'off') {
    return null;
  }

  return (
    <Old_CWBanner
      className="TermsBanner"
      bannerContent={
        <CWText type="b2" className="terms-text">
          Please check out our <a href={terms}>terms of service</a>.
        </CWText>
      }
      onClose={handleClickDismiss}
    />
  );
};
