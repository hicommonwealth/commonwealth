import 'components/component_kit/cw_profiles_list.scss';
import React from 'react';
import { CWIcon } from './cw_icons/cw_icon';

import { CWText } from './cw_text';
import { getClasses } from './helpers';

type ProfileRowStyleProps = {
  darkMode?: boolean;
  isSelected?: boolean;
};

export type ProfileRowProps = {
  name: string;
  onClick?: () => void;
} & ProfileRowStyleProps;

export const CWProfileRow = (props: ProfileRowProps) => {
  const { darkMode, isSelected, onClick, name } = props;

  return (
    <div
      className={getClasses<ProfileRowStyleProps>(
        { darkMode, isSelected },
        'ProfileRow'
      )}
      onClick={onClick}
    >
      <div className="avatar-and-name">
        <div className="avatar" />
        <CWText type="b1" fontWeight="bold" className="profile-row-text" noWrap>
          {name ?? 'Your Profile'}
        </CWText>
      </div>
      {isSelected && <CWIcon iconName="check" />}
    </div>
  );
};

type ProfilesListProps = {
  darkMode?: boolean;
  onClick?: () => void;
  profiles: Array<ProfileRowProps>;
};

export const CWProfilesList = (props: ProfilesListProps) => {
  const { darkMode, onClick, profiles } = props;

  return (
    <div
      className={getClasses<{ darkMode?: boolean }>(
        { darkMode },
        'ProfilesList'
      )}
    >
      <div
        className={getClasses<{ darkMode?: boolean }>(
          { darkMode },
          'ProfilesList'
        )}
      >
        {profiles.map((profile) => (
          <CWProfileRow
            darkMode={darkMode}
            isSelected={profile.isSelected}
            name={profile.name}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
};
