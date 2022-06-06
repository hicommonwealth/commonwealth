/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_validation_text.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';

export type ValidationStatus = 'success' | 'failure';

export type ValidationTextAttrs = {
  message?: string;
  status?: ValidationStatus;
};

export class CWValidationText implements m.ClassComponent<ValidationTextAttrs> {
  view(vnode) {
    const { message, status } = vnode.attrs;
    return (
      <CWText
        type="caption"
        fontWeight="medium"
        className={`${ComponentType.ValidationText} ${status}`}
      >
        {message}
      </CWText>
    );
  }
}
