import { CommunityVerificationItem } from '@hicommonwealth/shared';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { ButtonType } from 'views/components/component_kit/new_designs/CWButton/CWButton';
import { Status } from './types';

type ComponentIcon =
  | 'stopSymbol'
  | 'socialVerified'
  | 'sandClock'
  | 'globe'
  | 'pins'
  | 'whiteCheck'
  | 'starGolden';

interface LevelBoxProps {
  level: number;
  title: string;
  description: string;
  color: string;
  status: Status;
  isLocked: boolean;
  icon?: ComponentIcon;
  items?: CommunityVerificationItem[];
  showArrow?: boolean;
  onClick?: () => void;
  showButton?: boolean;
  buttonLabel?: string;
  buttonType?: ButtonType;
  onButtonClick?: () => void;
  onItemClick?: (item: CommunityVerificationItem) => void;
}

const getTagType = (status: Status): 'passed' | 'proposal' => {
  return status === 'Done' ? 'passed' : 'proposal';
};

const CommunityTrustLevelItem = ({
  level,
  title,
  description,
  color,
  status,
  isLocked,
  icon,
  items,
  showArrow = false,
  onClick,
  showButton = false,
  buttonLabel,
  buttonType = 'primary',
  onButtonClick,
  onItemClick,
}: LevelBoxProps) => {
  return (
    <div
      className={`level-box level-${color} ${isLocked ? 'disabled' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={!isLocked ? onClick : undefined}
    >
      <div className="tier-icon">
        {icon && <CWIcon iconName={icon} iconSize="xl" />}
      </div>
      <div className="level-box-content">
        <div className="level-header">
          <div className="level-title">
            <CWText type="h5" fontWeight="semiBold">
              Level {level}: {title}
            </CWText>
          </div>
          {showButton ? (
            <CWButton
              label={buttonLabel || 'Verify'}
              buttonType={buttonType}
              buttonHeight="sm"
              onClick={(e) => {
                e.stopPropagation();
                onButtonClick?.();
              }}
            />
          ) : (
            <CWTag type={getTagType(status)} label={status} />
          )}
        </div>
        <div className="description-container">
          <CWText type="b2" className="level-description">
            {description}
          </CWText>
        </div>
        {items && items.length > 0 && (
          <div className={`level-items ${isLocked ? 'locked' : ''}`}>
            {items.map((item, idx) => (
              <div
                key={idx}
                className="level-item"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked && onClick) {
                    onClick();
                  }
                  if (onItemClick) {
                    onItemClick(item);
                  }
                }}
              >
                <div className="level-item-content">
                  <CWTag type={getTagType(status)} label={status} />
                  <CWText type="b2" className="item-label">
                    {item.label}
                  </CWText>
                </div>
                {showArrow && (
                  <div className="level-arrow">
                    <CWIcon iconName="arrowRightPhosphor" iconSize="small" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityTrustLevelItem;
