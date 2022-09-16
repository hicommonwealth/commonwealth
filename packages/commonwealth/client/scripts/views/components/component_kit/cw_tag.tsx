/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_tag.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { IconName } from './cw_icons/cw_icon_lookup';
import { CWIcon } from './cw_icons/cw_icon';

type TagStatus = 'passed' | 'failed' | 'active';

export type TagAttrs = {
  iconName?: IconName;
  label: string;
  status?: TagStatus;
};

export class CWTag implements m.ClassComponent<TagAttrs> {
  view(vnode) {
    const { iconName, label, status } = vnode.attrs;

    return (
      <div
        className={getClasses<{ status?: TagStatus }>(
          { status },
          ComponentType.Tag
        )}
      >
        {!!iconName && (
          <CWIcon iconName={iconName} iconSize="small" className="tag-icon" />
        )}
        <CWText type="caption" fontWeight="medium" className="tag-text">
          {label}
        </CWText>
      </div>
    );
  }
}
