/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_form.scss';

import { ComponentType } from './types';
import { CWDivider } from './cw_divider';
import { CWText } from './cw_text';

type FormAttrs = {
  description: string;
  title: string;
  topRightElement?: m.Vnode;
};

export class CWForm extends ClassComponent<FormAttrs> {
  view(vnode: m.Vnode<FormAttrs>) {
    const { description, title } = vnode.attrs;

    return (
      <div className={ComponentType.Form}>
        <div className="header">
          <div>
            <CWText type="h3" fontWeight="medium">
              {title}
            </CWText>
            <CWText type="b1">{description}</CWText>
          </div>
          {vnode.attrs.topRightElement && (
            <div className="top-right-element">
              {vnode.attrs.topRightElement}
            </div>
          )}
        </div>
        <CWDivider />
        <div className="content">{vnode.children}</div>
      </div>
    );
  }
}
