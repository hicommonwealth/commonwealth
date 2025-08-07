import React, { ReactNode } from 'react';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWTag } from '../../component_kit/CWTag';

type Status = 'Done' | 'Not Started';

interface LevelBoxProps {
  level: number;
  title: string;
  description: string;
  status: Status;
  isLocked: boolean;
  icon?: ReactNode;
  items?: Array<{ label: string }>;
  showArrow?: boolean;
  onClick?: () => void;
  onItemClick?: (item: { label: string }) => void;
}

const getTagType = (status: Status): 'passed' | 'proposal' => {
  return status === 'Done' ? 'passed' : 'proposal';
};

const LevelBox = ({
  level,
  title,
  description,
  status,
  isLocked,
  icon,
  items,
  showArrow = false,
  onClick,
  onItemClick,
}: LevelBoxProps) => {
  return (
    <div
      className={`level-box level-${level} ${isLocked ? 'disabled' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={!isLocked ? onClick : undefined}
    >
      <div className="tier-icon">{icon}</div>
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
        </div>
        {items && items.length > 0 && (
          <div className={`level-items ${isLocked ? 'locked' : ''}`}>
            {items.map((item, idx) => (
              <div
                key={idx}
                className="level-item"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked && onItemClick) {
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

export default LevelBox;
