/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_spinner.scss';

import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';

export class CWSpinner implements m.ClassComponent {
  view() {
    return (
      <div className={ComponentType.Spinner}>
        <CWIcon iconName="cow" iconSize="xl" />
      </div>
    );
  }
}
