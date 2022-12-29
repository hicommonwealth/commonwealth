/* @jsx jsx */

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_form_section.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';
import { CWDivider } from './cw_divider';

type FormSectionAttrs = {
  description: string;
  title: string;
  topRightElement?: m.Vnode;
};

export class CWFormSection extends ClassComponent<FormSectionAttrs> {
  view(vnode: ResultNode<FormSectionAttrs>) {
    const {  description, title } = vnode.attrs;

    return (
      <div className={ComponentType.FormSection}>
        <div className="title">
          <CWText type="h4">{title}</CWText>
          {vnode.attrs.topRightElement && (
            <div className="top-right-element">
              {vnode.attrs.topRightElement}
            </div>
          )}
        </div>
        <div className="columns">
          <div className="left-side">
            <CWText type="b1">
              {description}
            </CWText>
          </div>
          <div className="right-side">
            {vnode.children}
          </div>
        </div>
        <CWDivider />
      </div>
    );
  }
}
