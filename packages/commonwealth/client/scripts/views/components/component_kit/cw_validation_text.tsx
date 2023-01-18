/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_validation_text.scss';
import m from 'mithril';
import { CWText } from './cw_text';

import { ComponentType } from './types';

export type ValidationStatus = 'success' | 'failure';

export type ValidationTextAttrs = {
  message?: string;
  status?: ValidationStatus;
};

export class CWValidationText extends ClassComponent<ValidationTextAttrs> {
  view(vnode: m.Vnode<ValidationTextAttrs>) {
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
