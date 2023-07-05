import React from 'react';

import 'components/component_kit/new_designs/cw_tag.scss';
import { CWIcon } from '../cw_icons/cw_icon';
import type { IconName } from '../cw_icons/cw_icon_lookup';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';

import { ComponentType } from '../types';
import { Avatar } from '../../Avatar';
import MinimumProfile from 'client/scripts/models/MinimumProfile';

type TagType =
  | 'passed'
  | 'failed'
  | 'active'
  | 'poll'
  | 'proposal'
  | 'referendum'
  | 'stage'
  | 'new'
  | 'spam'
  | 'trending'
  | 'disabled'
  // below to be replaced with appropriate stages
  | 'new-stage'
  | 'input'
  | 'login'
  | 'address';

export type TagProps = {
  iconName?: IconName;
  label: string;
  type?: TagType;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  trimAt?: number;
  // for styling purposes only. remove when
  // stage names provided
  classNames?: string;
  loginIcon?: IconName;
};

export const CWTag = ({ iconName, label, type, onClick, trimAt, classNames, loginIcon }: TagProps) => {
  const displayLabel = () => {
    if (!trimAt) {
      return label;
    }

    if (label?.length <= trimAt) {
      return label;
    }

    return label.slice(0, trimAt) + '...';
  };

  return (
    <div
      className={`${getClasses<{ type?: TagType }>({ type }, ComponentType.Tag)} ${classNames || ''}`}
      onClick={onClick}
    >
      { (type === 'login' || type === 'address') &&
        <CWIcon iconName={loginIcon} iconSize="small" className="tag-icon" />
      }
      { type === 'input' && 
        // profile &&
        // <Avatar
        //   url={profile?.avatarUrl}
        //   size={16}
        //   address={profile?.id}
        // />
        // icon inserted for styling purposes. 
        // replace CWIcon below with avatar above
        <CWIcon iconName='edgeware' iconSize="small" className="tag-icon" />
      }
      {!!iconName && (
        <CWIcon iconName={iconName} iconSize="small" className="tag-icon" />
      )}
      <CWText type="caption" fontWeight="medium" className="tag-text" noWrap>
        {displayLabel()}
      </CWText>
      { type === 'input' &&
        <div className="close-container">
          <CWIcon iconName='close' iconSize="small" className="tag-icon" />
        </div>
      }
    </div>
  );
};

function getLoginIcon(loginMethod) {
  switch(loginMethod) {
    case 'cosmos':
      return 'cosmos';
    case 'discord':
      return 'discord';
    case 'email':
      return 'email';
    case 'ethereum':
      return 'email';
    case 'github':
      return 'github';
    case 'near':
      return 'near';
    case 'polkadot':
      return 'polkadot';
    case 'polygon':
      return 'polygon';
    case 'twitter':
      return 'twitter';
    default:
      return 'ethereum';
  }
}
