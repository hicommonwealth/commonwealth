/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_form.scss';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';
import { CWDivider } from './cw_divider';
import { CWText } from './cw_text';

import { ComponentType } from './types';

type FormAttrs = {
  description: string;
  title: string;
  actions?: m.Vnode;
};

export class CWForm extends ClassComponent<FormAttrs> {
  view(vnode: m.Vnode<FormAttrs>) {
    const { description, title, actions } = vnode.attrs;

    return (
      <div className={ComponentType.Form}>
        <div className="header">
          <div>
            <CWText type="h3" fontWeight="medium">
              {title}
            </CWText>
            <CWText type="b1">{description}</CWText>
          </div>
          {actions && <div className="actions top">{actions}</div>}
        </div>
        <CWDivider />
        <div className="content">{vnode.children}</div>
        {actions && <div className="actions">{actions}</div>}
      </div>
    );
  }
}
