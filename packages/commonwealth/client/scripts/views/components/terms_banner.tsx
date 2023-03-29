import React from 'react';

import 'pages/terms_banner.scss';

import app from 'state';
import { CWBanner } from './component_kit/cw_banner';
import { CWText } from './component_kit/cw_text';

type TermsBannerProps = { terms: string };

export const TermsBanner = (props: TermsBannerProps) => {
  const { terms } = props;

  return (
    <CWBanner
      className="TermsBanner"
      bannerContent={
        <CWText type="b2" className="terms-text">
          Please check out our{' '}
          <a href={terms} target="_blank">
            terms of service
          </a>
          .
        </CWText>
      }
      onClose={() => localStorage.setItem(`${app.activeChainId()}-tos`, 'off')}
    />
  );
};
