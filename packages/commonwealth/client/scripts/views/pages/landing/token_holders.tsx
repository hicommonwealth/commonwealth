import React from 'react';

import 'pages/landing/token_holders.scss';

import { CWText } from '../../components/component_kit/cw_text';

export const TokenHolders = () => {
  return (
    <section className="TokenHolders">
      <div className="header">
        <CWText type="h3" fontWeight="semiBold">
          Token holders come together
        </CWText>
        <CWText type="h4" fontWeight="medium">
          Find your community and drive your token forward.
        </CWText>
      </div>
      <div className="holders-container">
        <div className="holder-card">
          <img src="static/img/circleCrowd.svg" alt="" />
          <CWText type="h4" fontWeight="semiBold">
            Your community is here.
          </CWText>
          <CWText>
            Stop bouncing between 10 tabs at once - everything you need to know
            about your token is here.
          </CWText>
        </div>
        <div className="holder-card">
          <img src="static/img/1stButtonToken.svg" alt="" />
          <CWText type="h4" fontWeight="semiBold">
            Claim your token.
          </CWText>
          <CWText>
            We generate pages for your favorite community and address from
            real-time chain activity. Claim yours.
          </CWText>
        </div>
        <div className="holder-card">
          <img src="static/img/bell.svg" alt="" />
          <CWText type="h4" fontWeight="semiBold">
            Stay updated.
          </CWText>
          <CWText>
            Be the first to know when community events are happening with
            in-app, email, and mobile push notifications.
          </CWText>
        </div>
        <div className="holder-card">
          <img src="static/img/calendar.svg" alt="" />
          <CWText type="h4" fontWeight="semiBold">
            Participate in events.
          </CWText>
          <CWText>
            Participate in events like upcoming votes, new projects and
            community initiatives.
          </CWText>
        </div>
      </div>
    </section>
  );
};
