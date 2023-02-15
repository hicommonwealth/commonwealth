/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_spinner.scss';
import m from 'mithril';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconSize } from './cw_icons/types';

import { ComponentType } from './types';

type SpinnerAttrs = {
  size?: IconSize;
};

export class CWSpinner extends ClassComponent<SpinnerAttrs> {
  view(vnode: m.Vnode<SpinnerAttrs>) {
    const { size = 'xl' } = vnode.attrs;

    return (
      <div className={ComponentType.Spinner}>
        <CWIcon iconName="cow" iconSize={size} />
      </div>
    );
  }
}
