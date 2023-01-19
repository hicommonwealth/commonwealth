/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_profiles_list.scss';

import { CWText } from './cw_text';
import { CWIcon } from './cw_icons/cw_icon';
import { getClasses } from './helpers';

type ProfileRowStyleAttrs = {
  darkMode?: boolean;
  isSelected?: boolean;
};

export type ProfileRowAttrs = {
  name: string;
  onClick?: () => void;
} & ProfileRowStyleAttrs;

export class CWProfileRow extends ClassComponent<ProfileRowAttrs> {
  view(vnode: ResultNode<ProfileRowAttrs>) {
    const { darkMode, isSelected, onClick, name } = vnode.attrs;

    return (
      <div
        className={getClasses<ProfileRowStyleAttrs>(
          { darkMode, isSelected },
          'ProfileRow'
        )}
        onClick={onClick}
      >
        <div className="avatar-and-name">
          <div className="avatar" />
          <CWText
            type="b1"
            fontWeight="bold"
            className="profile-row-text"
            noWrap
          >
            {name ?? 'Your Profile'}
          </CWText>
        </div>
        {isSelected && <CWIcon iconName="check" />}
      </div>
    );
  }
}

type ProfilesListAttrs = {
  darkMode?: boolean;
  onClick?: () => void;
  profiles: Array<ProfileRowAttrs>;
};

export class CWProfilesList extends ClassComponent<ProfilesListAttrs> {
  view(vnode: ResultNode<ProfilesListAttrs>) {
    const { darkMode, onClick, profiles } = vnode.attrs;

    return (
      <div
        className={getClasses<{ darkMode?: boolean }>({ darkMode }, 'ProfilesList')}
      >
        <div
          className={getClasses<{ darkMode?: boolean }>(
            { darkMode },
            'profile-rows-container'
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
  }
}
