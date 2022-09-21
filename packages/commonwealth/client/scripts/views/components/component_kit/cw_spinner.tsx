/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_spinner.scss';

import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { IconSize } from './cw_icons/types';

export class CWSpinner implements m.ClassComponent<{ size?: IconSize }> {
  view(vnode) {
    const { size = 'xl' } = vnode.attrs;

    return (
      <div className={ComponentType.Spinner}>
        <CWIcon iconName="cow" iconSize={size} />
      </div>
    );
  }
}
