import React from 'react';

import 'components/component_kit/cw_banner.scss';
import { CWIconButton } from './cw_icon_button';

import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type BannerProps = {
  bannerContent: string | React.ReactNode;
  className?: string;
  onClose?: () => void;
};

export const Old_CWBanner = ({
  bannerContent,
  className,
  onClose,
}: BannerProps) => {
  return (
    <div
      className={getClasses<{ className?: string }>(
        { className },
        ComponentType.Banner
      )}
    >
      <CWText type="b2">{bannerContent}</CWText>
      {onClose && <CWIconButton iconName="close" onClick={onClose} />}
    </div>
  );
};

export const CWMessageBanner = ({
  bannerContent,
  className,
  onClose,
}: BannerProps) => {
  return (
    <div
      className={getClasses<{ className?: string }>(
        { className },
        ComponentType.MessageBanner
      )}
    >
      <CWText type="b1" fontWeight="semiBold">
        {bannerContent}
      </CWText>
      {onClose && (
        <CWIconButton
          iconName="close"
          onClick={onClose}
          iconButtonTheme="primary"
        />
      )}
    </div>
  );
};
