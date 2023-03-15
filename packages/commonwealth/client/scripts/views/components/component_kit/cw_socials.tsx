import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/component_kit/cw_socials.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';
import { CWTextInput } from './cw_text_input';
import { CWIconButton } from './cw_icon_button';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWIcon } from './cw_icons/cw_icon';

type SocialsAttrs = {
  socials: string[];
  handleInputChange?: (value: string[]) => void;
};

export class CWSocials extends ClassComponent<SocialsAttrs> {
  private socials: string[];

  private addInputRow = () => {
    this.socials = [...this.socials, ''];
  };

  private deleteInputRow = (
    index: number,
    handleInputChange: (value: string[]) => void
  ) => {
    this.socials = this.socials.filter((_, i) => i !== index);
    handleInputChange(this.socials);
  };

  oninit(vnode: ResultNode<SocialsAttrs>) {
    this.socials = vnode.attrs.socials ? [...vnode.attrs.socials] : [];
  }

  view(vnode: ResultNode<SocialsAttrs>) {
    const { handleInputChange } = vnode.attrs;

    const socialsList = this.socials?.map((social, i) => {
      let name: string;
      let icon: IconName;
      let placeholder: string;

      if (social.includes('discord.com/')) {
        name = 'discord';
        icon = 'discord';
        placeholder = 'https://discord.com/...';
      } else if (social.includes('twitter.com/')) {
        name = 'twitter';
        icon = 'twitter';
        placeholder = 'https://twitter.com/...';
      } else if (social.includes('telegram.org/')) {
        name = 'telegram';
        icon = 'telegram';
        placeholder = 'https://telegram.org/...';
      } else if (social.includes('github.com/')) {
        name = 'github';
        icon = 'github';
        placeholder = 'https://github.com/...';
      } else {
        name = 'website';
        icon = 'website';
        placeholder = 'https://example.com';
      }

      return (
        <div className="input-row" key={i}>
          <CWTextInput
            name={name}
            value={social}
            inputValidationFn={(val: string) => {
              if (!val.match(/^(http(s)?:\/\/.)?([\da-z.-]+)\.([a-z.])/)) {
                return ['failure', 'Must enter valid website'];
              } else {
                return ['success', 'Input validated'];
              }
            }}
            iconRight={icon}
            placeholder={placeholder}
            onInput={(e) => {
              this.socials[i] = e.target.value;
              handleInputChange(this.socials);
              this.redraw();
            }}
          />
          <CWIconButton
            iconButtonTheme="neutral"
            iconName="trash"
            onClick={() => this.deleteInputRow(i, handleInputChange)}
          />
        </div>
      );
    });

    return (
      <div className={ComponentType.Socials}>
        {socialsList}
        <div className="add-social-link" onClick={this.addInputRow}>
          <CWIcon iconName="plus" iconSize="small" />
          <CWText>Add social link</CWText>
        </div>
      </div>
    );
  }
}
