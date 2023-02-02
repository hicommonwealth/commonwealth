/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';
import { CWLabel } from './component_kit/cw_label';
import { CWText } from './component_kit/cw_text';
import { CWTextArea } from './component_kit/cw_text_area';

import { CWTextInput } from './component_kit/cw_text_input';
import { CWToggle } from './component_kit/cw_toggle';

type InputRowAttrs = {
  value: string | number;
  disabled?: boolean;
  maxlength?: number;
  onChangeHandler: (e) => void;
  placeholder?: string;
  textarea?: boolean;
  title: string;
};

export class InputRow extends ClassComponent<InputRowAttrs> {
  view(vnode: m.Vnode<InputRowAttrs>) {
    const {
      value,
      disabled,
      maxlength,
      onChangeHandler,
      placeholder,
      textarea,
      title,
    } = vnode.attrs;

    return (
      <div class="InputRow">
        {textarea && <CWLabel label={title} />}
        {textarea ? (
          <CWTextArea
            value={value}
            placeholder={placeholder}
            disabled={!!disabled}
            maxlength={maxlength}
            oninput={(e) => {
              onChangeHandler((e.target as any).value);
            }}
          />
        ) : (
          <CWTextInput
            label={title}
            value={value}
            placeholder={placeholder}
            maxlength={maxlength}
            disabled={!!disabled}
            oninput={(e) => {
              onChangeHandler((e.target as any).value);
            }}
          />
        )}
      </div>
    );
  }
}

type ToggleRowAttrs = {
  caption?: (e) => void;
  defaultValue: boolean;
  disabled?: boolean;
  onToggle: (e) => void;
  title: string;
};

export class ToggleRow extends ClassComponent<ToggleRowAttrs> {
  checked: boolean;

  oninit(vnode: m.Vnode<ToggleRowAttrs>) {
    this.checked = vnode.attrs.defaultValue;
  }

  view(vnode: m.Vnode<ToggleRowAttrs>) {
    const { caption, disabled, onToggle, title } = vnode.attrs;

    return (
      <div class="ToggleRow">
        <CWLabel label={title} />
        <div class="toggle-and-caption">
          <CWToggle
            checked={this.checked}
            disabled={!!disabled}
            onchange={() => {
              this.checked = !this.checked;
              onToggle(this.checked);
            }}
          />
          {caption && <CWText type="caption">{caption(this.checked)}</CWText>}
        </div>
      </div>
    );
  }
}

type IdRowAttrs = { id: string };

export class IdRow extends ClassComponent<IdRowAttrs> {
  view(vnode: m.Vnode<IdRowAttrs>) {
    const { id } = vnode.attrs;

    return (
      <div class="IDRow">
        <CWLabel label="ID" />
        <div class={`id ${!id.length && 'placeholder'}`}>
          {!id.length ? 'ID will show up here based on your name' : id}
        </div>
      </div>
    );
  }
}
