import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { IOS_APP_STORE_LANDING_URL } from 'views/components/DownloadMobileApp/MobileLandingURLs';
import ShareSection from '../ShareSection';
import './DownloadMobileAppContent.scss';

import { CWText } from '../component_kit/cw_text';
import AppStoreQRCode from './AppStoreQRCode.png';

export const DownloadMobileAppContent = () => {
  return (
    <div className="DownloadMobileAppContent">
      <div className="Background">
        <img src={AppStoreQRCode} alt="App Store QR Code" />

        <CWText>
          <i>Scan QR Code on your device to go to the App Store.</i>
        </CWText>

        <CWText>Common now has an app in the App Store!</CWText>

        <CWText>Android coming soon!</CWText>
      </div>

      <div className="Copy">
        <CWTooltip
          placement="top"
          content="Link copied to clipboard!"
          renderTrigger={(handleInteraction) => {
            return (
              <CWTextInput
                fullWidth
                type="text"
                value={IOS_APP_STORE_LANDING_URL}
                readOnly
                onClick={(event) => {
                  handleInteraction(event);
                }}
                iconRight={<CWIcon iconName="linkPhosphor" />}
              />
            );
          }}
        />
      </div>

      <ShareSection url={IOS_APP_STORE_LANDING_URL} />
    </div>
  );
};
