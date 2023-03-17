import React, { useState } from 'react';

import 'components/component_kit/cw_socials.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';
import { CWTextInput } from './cw_text_input';
import { CWIconButton } from './cw_icon_button';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWIcon } from './cw_icons/cw_icon';

type SocialsProps = {
  socials: string[];
  handleInputChange?: (value: string[]) => void;
};

export const CWSocials = (props: SocialsProps) => {
  const [socials, setSocials] = useState(props.socials ?? []);

  const addInputRow = () => {
    setSocials([...socials, '']);
  };

  const deleteInputRow = (index: number) => {
    const newSocials = socials.filter((_, i) => i !== index);
    setSocials(newSocials);
    props.handleInputChange(newSocials);
  };

  const socialsList = socials?.map((social, i) => {
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
            const newSocials = [...socials];
            newSocials[i] = e.target.value;
            setSocials(newSocials);
            props.handleInputChange(newSocials);
          }}
        />
        <CWIconButton
          iconButtonTheme="neutral"
          iconName="trash"
          onClick={() => deleteInputRow(i)}
        />
      </div>
    );
  });

  return (
    <div className={ComponentType.Socials}>
      {socialsList}
      <div className="add-social-link" onClick={addInputRow}>
        <CWIcon iconName="plus" iconSize="small" />
        <CWText>Add social link</CWText>
      </div>
    </div>
  );
};
