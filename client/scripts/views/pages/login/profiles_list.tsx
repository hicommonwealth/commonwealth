/* @jsx m */

import m from 'mithril';

import 'pages/login/profiles_list.scss';

import { CWText } from '../../components/component_kit/cw_text';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { getClasses } from '../../components/component_kit/helpers';

export type ProfileRowAttrs = {
  isSelected?: boolean;
  name: string;
  onclick?: () => void;
};

export class ProfileRow implements m.ClassComponent<ProfileRowAttrs> {
  view(vnode) {
    const { isSelected, onclick, name } = vnode.attrs;
    return (
      <div
        class={getClasses<{ isSelected: boolean }>(
          { isSelected },
          'ProfileRow'
        )}
        onclick={onclick}
      >
        <div class="avatar-and-name">
          <div class="avatar" />
          <CWText type="b1" fontWeight="bold" noWrap>
            {name}
          </CWText>
        </div>
        {isSelected && <CWIcon iconName="check" />}
      </div>
    );
  }
}

export class ProfilesList
  implements
    m.ClassComponent<{ onclick: () => void; profiles: Array<ProfileRowAttrs> }>
{
  view(vnode) {
    const { onclick, profiles } = vnode.attrs;
    return (
      <div class="ProfilesList">
        <div class="profile-rows-container">
          {profiles.map((profile) => (
            <ProfileRow
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
