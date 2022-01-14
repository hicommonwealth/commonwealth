/* @jsx m */

import m, { Vnode } from 'mithril';
import 'components/component_kit/cw_button_group.scss';

import { State, ComponentType } from './types';
import { ButtonProps } from './cw_button';

type ButtonGroupProps = {
  children: Array<Vnode<ButtonProps, State>>;
};

export const CWButtonGroup: m.Component<ButtonGroupProps, State> = {
  view: (vnode) => {
    const { children } = vnode.attrs;
    return <div class={ComponentType.ButtonGroup}>{children}</div>;
  },
};
