/* @jsx m */

import m from 'mithril';

import 'components/rules/attribute_display.scss';
import { CWText } from '../component_kit/cw_text';
import { CWTextInput } from '../component_kit/cw_text_input';

type AttributeDisplayAttrs = {
  label: string;
  value: string;
  enableCopy: boolean;
};

export class AttributeDisplay
  implements m.ClassComponent<AttributeDisplayAttrs>
{
  view(vnode) {
    const { label, value, enableCopy } = vnode.attrs;

    return (
      <div class="AttributeDisplay">
        <CWText className="attribute-label">{`${label}:`}</CWText>
        <CWTextInput
          containerClassName="display-input"
          disabled
          value={value}
        ></CWTextInput>
      </div>
    );
  }
}
