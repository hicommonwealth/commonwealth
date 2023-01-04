/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/rules/attribute_display.scss';
import { CWText } from '../component_kit/cw_text';
import { CWTextInput } from '../component_kit/cw_text_input';

type AttributeDisplayAttrs = {
  label: string;
  value: string;
};

export class AttributeDisplay extends ClassComponent<AttributeDisplayAttrs> {
  view(vnode) {
    const { label, value } = vnode.attrs;

    return (
      <div class="AttributeDisplay">
        <CWText className="attribute-label">{`${label}:`}</CWText>
        <CWTextInput
          containerClassName="display-input"
          disabled
          value={value}
        />
      </div>
    );
  }
}
