/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_collapsible.scss';

import { ComponentType } from './types';

export class CWCollapsible implements m.ClassComponent {
  view() {
    return <div class={ComponentType.Collapsible}></div>;
  }
}
