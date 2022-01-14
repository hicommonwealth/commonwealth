/* @jsx m */

import m, { Vnode } from 'mithril';
import 'components/component_kit/cw_button_group.scss';

import { ComponentType } from './types';
import { ButtonProps } from './cw_button';

type ButtonGroupProps = {
  children: Array<Vnode<ButtonProps>>;
};

export const CWButtonGroup: m.Component<ButtonGroupProps> = {
  view: (vnode) => {
    const { children } = vnode.attrs;
    return <div class={ComponentType.ButtonGroup}>{children}</div>;
  },
};
