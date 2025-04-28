import React from 'react';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWTag } from '../../component_kit/new_designs/CWTag';
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
  items?: Array<{ label: string }>;
  showArrow?: boolean;
}

const getTagType = (status: Status): 'passed' | 'proposal' => {
  return status === 'Done' ? 'passed' : 'proposal';
};

const LevelBox = ({
  level,
  title,
  description,
  color,
  status,
  isLocked,
  icon,
  items,
  showArrow = false,
}: LevelBoxProps) => {
  return (
    <div className={`level-box level-${color} ${isLocked ? 'disabled' : ''}`}>
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
          <CWTag type={getTagType(status)} label={status} />
        </div>
        <div className="description-container">
          <CWText type="b2" className="level-description">
            {description}
          </CWText>
          {showArrow && !items?.length && (
            <div className="level-arrow">
              <CWIcon iconName="arrowRightPhosphor" iconSize="small" />
            </div>
          )}
        </div>
        {items && items.length > 0 && (
          <div className={`level-items ${isLocked ? 'locked' : ''}`}>
            {items.map((item, idx) => (
              <div key={idx} className="level-item">
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

export default LevelBox;
