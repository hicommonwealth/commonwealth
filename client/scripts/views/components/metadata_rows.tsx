/* @jsx m */

import m from 'mithril';
import { Select, Switch, TextArea } from 'construct-ui';

import { CWTextInput } from './component_kit/cw_text_input';

type InputRowAttrs = {
  defaultValue: string;
  disabled?: boolean;
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
      onChangeHandler,
      placeholder,
      textarea,
      title,
      value,
    } = vnode.attrs;

    return (
      <div class="InputRow">
        {textarea && <label>{title}</label>}
        {textarea ? (
          <TextArea
            defaultValue={defaultValue}
            value={value}
            placeholder={placeholder}
            fluid={true}
            disabled={disabled || false}
            style={{ height: '296px', marginBottom: '20px' }}
            oninput={(e) => {
              onChangeHandler((e.target as any).value);
            }}
          />
        ) : (
          <CWTextInput
            label={title}
            defaultValue={defaultValue}
            value={value}
            placeholder={placeholder}
            fluid={true}
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
        <label>{title}</label>
        <Switch
          checked={this.checked}
          disabled={disabled || false}
          onchange={() => {
            this.checked = !this.checked;
            onToggle(this.checked);
          }}
        />
        {caption && <div class="switch-caption">{caption(this.checked)}</div>}
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
        <label>{title}</label>
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
