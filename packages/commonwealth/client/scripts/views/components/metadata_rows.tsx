/* @jsx m */

import m from 'mithril';
import { Select, Switch } from 'construct-ui';

import { CWTextInput } from './component_kit/cw_text_input';
import { CWLabel } from './component_kit/cw_label';
import { CWTextArea } from './component_kit/cw_text_area';

type InputRowAttrs = {
  defaultValue: string;
  disabled?: boolean;
  maxlength?: number;
  onChangeHandler: (e) => void;
  placeholder?: string;
  textarea?: boolean;
  title: string;
  value?: string;
};

export class InputRow implements m.ClassComponent<InputRowAttrs> {
  view(vnode) {
    const {
      defaultValue,
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
            defaultValue={defaultValue}
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
            defaultValue={defaultValue}
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
  label?: (e) => void;
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
    const { label, disabled, onToggle, title } = vnode.attrs;

    return (
      <div class="ToggleRow">
        <CWLabel label={title} />
        <div class="toggle-and-label">
          <Switch
            checked={this.checked}
            disabled={disabled || false}
            onchange={() => {
              this.checked = !this.checked;
              onToggle(this.checked);
            }}
          />
          {label && <div class="switch-label">{label(this.checked)}</div>}
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
