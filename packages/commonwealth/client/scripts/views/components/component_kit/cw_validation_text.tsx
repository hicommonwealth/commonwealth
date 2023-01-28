/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_validation_text.scss';
import { CWText } from './cw_text';

import { ComponentType } from './types';

export type ValidationStatus = 'success' | 'failure';

export type ValidationTextAttrs = {
  message?: string;
  status?: ValidationStatus;
};

export class CWValidationText extends ClassComponent<ValidationTextAttrs> {
  view(vnode: ResultNode<ValidationTextAttrs>) {
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
