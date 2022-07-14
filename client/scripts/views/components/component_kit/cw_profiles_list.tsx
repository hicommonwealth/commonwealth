/* @jsx m */

import m from 'mithril';

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
  onclick?: () => void;
} & ProfileRowStyleAttrs;

export class CWProfileRow implements m.ClassComponent<ProfileRowAttrs> {
  view(vnode) {
    const { darkMode, isSelected, onclick, name } = vnode.attrs;

    return (
      <div
        class={getClasses<ProfileRowStyleAttrs>(
          { darkMode, isSelected },
          'ProfileRow'
        )}
        onclick={onclick}
      >
        <div class="avatar-and-name">
          <div class="avatar" />
          <CWText
            type="b1"
            fontWeight="bold"
            className="profile-row-text"
            noWrap
          >
            {name}
          </CWText>
        </div>
        {isSelected && <CWIcon iconName="check" />}
      </div>
    );
  }
}

type ProfilesListAttrs = {
  darkMode?: boolean;
  onclick: () => void;
  profiles: Array<ProfileRowAttrs>;
};

export class CWProfilesList implements m.ClassComponent<ProfilesListAttrs> {
  view(vnode) {
    const { darkMode, onclick, profiles } = vnode.attrs;

    return (
      <div
        class={getClasses<{ darkMode?: boolean }>({ darkMode }, 'ProfilesList')}
      >
        <div
          class={getClasses<{ darkMode?: boolean }>(
            { darkMode },
            'profile-rows-container'
          )}
        >
          {profiles.map((profile) => (
            <CWProfileRow
              darkMode={darkMode}
              isSelected={profile.isSelected}
              name={profile.name}
              onclick={onclick}
            />
          ))}
        </div>
      </div>
    );
  }
}
