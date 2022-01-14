/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_button_group.scss';

import { State, ComponentType, ButtonGroupProps } from './types';

export const CWButtonGroup: m.Component<ButtonGroupProps, State> = {
  view: (vnode) => {
    const { children } = vnode.attrs;
    return <div class={ComponentType.ButtonGroup}>{children}</div>;
  },
};
