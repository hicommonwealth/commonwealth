/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_spinner.scss';

import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { IconSize } from './cw_icons/types';

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
