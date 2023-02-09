import React from 'react';

import { ClassComponent} from

 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import { CWLabel } from './component_kit/cw_label';
import { CWText } from './component_kit/cw_text';
import { CWTextArea } from './component_kit/cw_text_area';

import { CWTextInput } from './component_kit/cw_text_input';
import { CWToggle } from './component_kit/cw_toggle';

type InputRowAttrs = {
  value: string | number;
  disabled?: boolean;
  maxLength?: number;
  onChangeHandler: (e) => void;
  placeholder?: string;
  textarea?: boolean;
  title: string;
};

export class InputRow extends ClassComponent<InputRowAttrs> {
  view(vnode: ResultNode<InputRowAttrs>) {
    const {
      value,
      disabled,
      maxLength,
      onChangeHandler,
      placeholder,
      textarea,
      title,
    } = vnode.attrs;

    return (
      <div className="InputRow">
        {textarea && <CWLabel label={title} />}
        {textarea ? (
          <CWTextArea
            value={value}
            placeholder={placeholder}
            disabled={!!disabled}
            maxLength={maxLength}
            onInput={(e) => {
              onChangeHandler((e.target as any).value);
            }}
          />
        ) : (
          <CWTextInput
            label={title}
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={!!disabled}
            onInput={(e) => {
              onChangeHandler((e.target as any).value);
            }}
          />
        )}
      </div>
    );
  }
}

type ToggleRowAttrs = {
  caption?: (e) => string;
  defaultValue: boolean;
  disabled?: boolean;
  onToggle: (e) => void;
  title: string;
};

export class ToggleRow extends ClassComponent<ToggleRowAttrs> {
  checked: boolean;

  oninit(vnode: ResultNode<ToggleRowAttrs>) {
    this.checked = vnode.attrs.defaultValue;
  }

  view(vnode: ResultNode<ToggleRowAttrs>) {
    const { caption, disabled, onToggle, title } = vnode.attrs;

    return (
      <div className="ToggleRow">
        <CWLabel label={title} />
        <div className="toggle-and-caption">
          <CWToggle
            checked={this.checked}
            disabled={!!disabled}
            onChange={() => {
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
  view(vnode: ResultNode<IdRowAttrs>) {
    const { id } = vnode.attrs;

    return (
      <div className="IDRow">
        <CWLabel label="ID" />
        <div className={`id ${!id.length && 'placeholder'}`}>
          {!id.length ? 'ID will show up here based on your name' : id}
        </div>
      </div>
    );
  }
}
