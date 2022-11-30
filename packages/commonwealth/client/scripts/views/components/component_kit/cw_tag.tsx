/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_tag.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { IconName } from './cw_icons/cw_icon_lookup';
import { CWIcon } from './cw_icons/cw_icon';

type TagType =
  | 'passed'
  | 'failed'
  | 'active'
  | 'poll'
  | 'proposal'
  | 'referendum';

export type TagAttrs = {
  iconName?: IconName;
  label: string;
  type?: TagType;
};

export class CWTag extends ClassComponent<TagAttrs> {
  view(vnode: m.Vnode<TagAttrs>) {
    const { iconName, label, type } = vnode.attrs;

    return (
      <div
        className={getClasses<{ type?: TagType }>({ type }, ComponentType.Tag)}
      >
        {!!iconName && (
          <CWIcon iconName={iconName} iconSize="small" className="tag-icon" />
        )}
        <CWText type="caption" fontWeight="medium" className="tag-text" noWrap>
          {label}
        </CWText>
      </div>
    );
  }
}
