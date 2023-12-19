import {
  CheckCircle,
  IconProps,
  Info,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import React, { ReactNode } from 'react';

import clsx from 'clsx';
import 'components/component_kit/new_designs/CWBanner.scss';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  ButtonProps,
  ButtonType,
  CWButton,
} from 'views/components/component_kit/new_designs/cw_button';

// TODO this component covers only one type of Banner,
// it should be extended with other types
// https://github.com/hicommonwealth/commonwealth/issues/4407
//

const typeIconLookup: {
  [key in BannerType]: React.ForwardRefExoticComponent<IconProps>;
} = {
  default: null,
  info: Info,
  success: CheckCircle,
  warning: WarningCircle,
  error: Warning,
};

export type BannerType = 'default' | 'info' | 'success' | 'warning' | 'error';

interface CWBannerProps {
  type?: BannerType;
  title: string;
  body?: string;
  buttons?: ButtonProps[];
  className?: string;
  onClose: () => void;
  footer?: ReactNode;
}

const getButtonType = (index: number, bannerType: BannerType): ButtonType => {
  if (index === 0 && bannerType === 'error') {
    return 'primary';
  }

  if (index === 0) {
    return 'secondary';
  }

  return 'tertiary';
};

const CWBanner = ({
  type = 'default',
  title,
  body,
  buttons,
  className,
  onClose,
  footer,
}: CWBannerProps) => {
  const TypeIcon = typeIconLookup[type];

  return (
    <div className={clsx('CWBanner', className, type)}>
      {type !== 'default' && (
        <div className="type-icon-container">
          <TypeIcon size={24} />
        </div>
      )}
      <div className="content-container">
        <CWText type="b1" fontWeight="medium" className="header">
          {title}
        </CWText>
        {body && (
          <div>
            <CWText type="b2" className="body">
              {body}
            </CWText>
          </div>
        )}
        {buttons?.length > 0 && (
          <div className="actions-row">
            {buttons.map((buttonProps, index) => {
              const buttonType = getButtonType(index, type);

              return (
                <CWButton
                  key={`${buttonProps.label}-index`}
                  buttonHeight="sm"
                  buttonType={buttonType}
                  {...buttonProps}
                />
              );
            })}
          </div>
        )}
        {footer && <div className="footer">{footer}</div>}
      </div>
      <div className="close-icon-container">
        <X weight="light" size={20} className="close-icon" onClick={onClose} />
      </div>
    </div>
  );
};

export default CWBanner;
