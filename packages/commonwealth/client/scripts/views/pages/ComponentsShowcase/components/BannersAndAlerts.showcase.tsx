import React, { useState } from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner, {
  BannerType,
} from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

const bannerTypes: BannerType[] = [
  'default',
  'info',
  'success',
  'warning',
  'error',
];

const initialBannersState: { [K in BannerType]: boolean } = bannerTypes.reduce(
  (acc, el) => ({ ...acc, [el]: true }),
  {} as { [K in BannerType]: boolean },
);

const BannersAndAlertsShowcase = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(initialBannersState);
  const [isAlertVisible, setIsAlertVisible] = useState(initialBannersState);

  return (
    <>
      <CWText type="h5">Banners</CWText>

      <CWButton
        buttonHeight="sm"
        label="Restore all banners"
        onClick={() => setIsBannerVisible(initialBannersState)}
      />

      <div className="flex-column">
        {bannerTypes.map((bannerType, i) => {
          if (!isBannerVisible[bannerType]) {
            return null;
          }

          return (
            <CWBanner
              key={i}
              type={bannerType}
              title="Default banner"
              body="This is banner body with custom message"
              buttons={[{ label: 'Primary' }, { label: 'Secondary' }]}
              onClose={() => {
                setIsBannerVisible((prevState) => ({
                  ...prevState,
                  [bannerType]: false,
                }));
              }}
            />
          );
        })}
      </div>

      <CWText type="h5">Alerts</CWText>
      <CWButton
        buttonHeight="sm"
        label="Restore all alerts"
        onClick={() => setIsAlertVisible(initialBannersState)}
      />
      <div className="flex-column">
        {bannerTypes.map((bannerType, i) => {
          if (!isAlertVisible[bannerType]) {
            return null;
          }

          return (
            <CWBanner
              key={i}
              type={bannerType}
              title="Default alert"
              body="This is alert body with custom message"
              onClose={() => {
                setIsAlertVisible((prevState) => ({
                  ...prevState,
                  [bannerType]: false,
                }));
              }}
            />
          );
        })}
      </div>
    </>
  );
};

export default BannersAndAlertsShowcase;
