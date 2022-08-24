/* @jsx m */

import m from 'mithril';
import { Select } from 'construct-ui';

import { CWTextInput } from './component_kit/cw_text_input';
import { CWLabel } from './component_kit/cw_label';
import { CWTextArea } from './component_kit/cw_text_area';
import { CWToggle } from './component_kit/cw_toggle';
import { CWText } from './component_kit/cw_text';

type InputRowAttrs = {
  value: string;
  disabled?: boolean;
  maxlength?: number;
  onChangeHandler: (e) => void;
  placeholder?: string;
  textarea?: boolean;
  title: string;
};

export class InputRow implements m.ClassComponent<InputRowAttrs> {
  view(vnode) {
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
            disabled={disabled || false}
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
            disabled={disabled || false}
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

export class ToggleRow implements m.ClassComponent<ToggleRowAttrs> {
  checked: boolean;

  oninit(vnode) {
    this.checked = vnode.attrs.defaultValue;
  }

  view(vnode) {
    const { caption, disabled, onToggle, title } = vnode.attrs;

    return (
      <div class="ToggleRow">
        <CWLabel label={title} />
        <div class="toggle-and-caption">
          <CWToggle
            checked={this.checked}
            disabled={disabled || false}
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

type SelectRowAttrs = {
  onchange: (e) => void;
  options: string[];
  title: string;
  value: string;
};

export class SelectRow implements m.ClassComponent<SelectRowAttrs> {
  view(vnode) {
    const { onchange, options, title, value } = vnode.attrs;

    return (
      <div class="SelectRow">
        <CWLabel label={title} />
        <Select
          options={options}
          onchange={(e) => {
            onchange((e.currentTarget as HTMLInputElement).value);
          }}
          defaultValue={value}
        />
      </div>
    );
  }
}

type IdRowAttrs = { id: string };

export class IdRow implements m.ClassComponent<IdRowAttrs> {
  view(vnode) {
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
