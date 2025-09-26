import { useFlag } from 'client/scripts/hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWMessageBanner } from '../components/component_kit/cw_banner';
import { CWText } from '../components/component_kit/cw_text';
import {
  ButtonType,
  CWButton,
} from '../components/component_kit/new_designs/CWButton';
import './CWLayoutBanner.scss';

const BANNERS = {
  POTENTIAL_COMMON_CLAIM: {
    headline: 'You do not have a COMMON claim.',
    subText: (
      <>
        This won&apos;t be the only opportunity to earn COMMON, we&apos;ll
        have&nbsp;
        <a href="#"> future community rewards to allocate</a>
      </>
    ),
    cta: undefined,
  },
  EXISTING_COMMON_CLAIM: {
    headline:
      '🎉 COMMON is Live. Check your potential claim on your rewards page',
    subText: undefined,
    cta: {
      type: 'secondary' as ButtonType,
      label: 'Claim COMMON',
      onClick: (navigate: ReturnType<typeof useCommonNavigate>) => {
        navigate('/wallet', {}, null);
      },
    },
  },
} as const;

const CWLayoutBanner = () => {
  const user = useUserStore();
  const key = user.isLoggedIn
    ? 'EXISTING_COMMON_CLAIM'
    : 'POTENTIAL_COMMON_CLAIM';
  const config = BANNERS[key];
  const [isHidden, setIsHidden] = useState(
    localStorage.getItem(key)?.toLowerCase() === 'true',
  );
  const claimsEnabled = useFlag('claims');
  const navigate = useCommonNavigate();

  const handleClose = () => {
    setIsHidden(true);
    localStorage.setItem(key, 'true');
  };

  if (isHidden || !claimsEnabled) return <></>;

  return (
    <CWMessageBanner
      className="CWLayoutBanner"
      bannerContent={
        <div className="layout-banner">
          {config.headline && (
            <CWText type="buttonSm" className="headline">
              {config.headline}
              {config.subText && (
                <CWText type="buttonMini">{config.subText}</CWText>
              )}
            </CWText>
          )}
          {config.cta && (
            <CWButton
              buttonHeight="sm"
              buttonType={config.cta.type}
              label={config.cta.label}
              onClick={() => config.cta.onClick(navigate)}
            />
          )}
        </div>
      }
      onClose={handleClose}
    />
  );
};

export { CWLayoutBanner };
export default CWLayoutBanner;
