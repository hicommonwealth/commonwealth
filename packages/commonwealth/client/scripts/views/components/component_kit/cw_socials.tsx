import React, { useState } from 'react';

import 'components/component_kit/cw_socials.scss';

import { CWIconButton } from './cw_icon_button';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';
import { CWTextInput } from './cw_text_input';
import { ComponentType } from './types';

type SocialsProps = {
  socials: string[];
  handleInputChange?: (value: string[]) => void;
};

export const CWSocials = ({ handleInputChange, socials }: SocialsProps) => {
  const [propSocials, setPropSocials] = useState(socials ?? []);

  const addInputRow = () => {
    setPropSocials([...propSocials, '']);
  };

  const deleteInputRow = (index: number) => {
    const newSocials = propSocials.filter((_, i) => i !== index);
    setPropSocials(newSocials);
    handleInputChange(newSocials);
  };

  const socialsList = propSocials?.map((social, i) => {
    let name: string;
    let icon: IconName;
    let placeholder: string;

    if (social.includes('discord.com/')) {
      name = 'discord';
      icon = 'discord';
      placeholder = 'https://discord.com/...';
    } else if (social.includes('twitter.com/')) {
      name = 'X (Twitter)';
      icon = 'twitterX';
      placeholder = 'https://twitter.com/...';
    } else if (social.includes('telegram.org/')) {
      name = 'telegram';
      icon = 'telegram';
      placeholder = 'https://telegram.org/...';
    } else if (social.includes('t.me/')) {
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
            const newSocials = [...propSocials];
            newSocials[i] = e.target.value;
            setPropSocials(newSocials);
            handleInputChange(newSocials);
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
