/* @jsx m */

import m from 'mithril';
import { Select, Switch, TextArea } from 'construct-ui';

import { CWTextInput } from './component_kit/cw_text_input';

type InputPropertyRowAttrs = {
  defaultValue: string;
  disabled?: boolean;
  onChangeHandler: (e) => void;
  placeholder?: string;
  textarea?: boolean;
  title: string;
  value?: string;
};

export class InputPropertyRow
  implements m.ClassComponent<InputPropertyRowAttrs>
{
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
      <tr class="InputPropertyRow">
        <td class="title-column">{title}</td>
        <td>
          {textarea ? (
            <TextArea
              defaultValue={defaultValue}
              value={value}
              placeholder={placeholder}
              fluid={true}
              disabled={disabled || false}
              oninput={(e) => {
                onChangeHandler((e.target as any).value);
              }}
            />
          ) : (
            <CWTextInput
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
        </td>
      </tr>
    );
  }
}

type TogglePropertyRowAttrs = {
  caption?: (e) => void;
  defaultValue: boolean;
  disabled?: boolean;
  onToggle: (e) => void;
  title: string;
};

export class TogglePropertyRow
  implements m.ClassComponent<TogglePropertyRowAttrs>
{
  checked: boolean;

  oninit(vnode) {
    this.checked = vnode.attrs.defaultValue;
  }

  view(vnode) {
    const { caption, disabled, onToggle, title } = vnode.attrs;

    return (
      <tr class="TogglePropertyRow">
        <td>{title}</td>
        <td class="ToggleContent">
          <Switch
            checked={this.checked}
            disabled={disabled || false}
            onchange={() => {
              this.checked = !this.checked;
              onToggle(this.checked);
            }}
          />
          {caption && <div class="switch-caption">{caption(this.checked)}</div>}
        </td>
      </tr>
    );
  }
}

type SelectPropertyRowAttrs = {
  onchange: (e) => void;
  options: string[];
  title: string;
  value: string;
};

export class SelectPropertyRow
  implements m.ClassComponent<SelectPropertyRowAttrs>
{
  view(vnode) {
    const { onchange, options, title, value } = vnode.attrs;

    return (
      <tr class="SelectPropertyRow">
        <td>{title}</td>
        <td>
          <Select
            options={options}
            onchange={(e) => {
              onchange((e.currentTarget as HTMLInputElement).value);
            }}
            defaultValue={value}
          />
        </td>
      </tr>
    );
  }
}
