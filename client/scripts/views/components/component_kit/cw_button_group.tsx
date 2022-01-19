/* @jsx m */

import m, { Vnode } from 'mithril';
import 'components/component_kit/cw_button_group.scss';

import { ComponentType } from './types';
import { ButtonAttrs } from './cw_button';

type ButtonGroupAttrs = {
  children: Array<Vnode<ButtonAttrs>>;
};

export const CWButtonGroup: m.Component<ButtonGroupAttrs> = {
  view: (vnode) => {
    const { children } = vnode.attrs;
    return <div class={ComponentType.ButtonGroup}>{children}</div>;
  },
};
