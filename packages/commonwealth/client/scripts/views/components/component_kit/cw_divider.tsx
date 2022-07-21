/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_divider.scss';

import { ComponentType } from './types';

export class CWDivider implements m.ClassComponent {
  view() {
    return <div class={ComponentType.Divider} />;
  }
}
