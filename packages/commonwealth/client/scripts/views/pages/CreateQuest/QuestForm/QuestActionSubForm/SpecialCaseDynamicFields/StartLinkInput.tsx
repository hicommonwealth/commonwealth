import React from 'react';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { SpecialCaseDynamicFieldsProps } from './types';

const StartLinkInput = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  if (!config?.requires_start_link) return <></>;

  const inputConfig = {
    placeholders: {
      discordServerUrl: `https://discord.gg/commonwealth`,
    },
    labels: {
      discordServerUrl: 'Discord Server Url',
    },
  };

  const getStartLinkInputConfig = () => {
    if (config?.requires_discord_server_id) {
      return {
        label: inputConfig.labels.discordServerUrl,
        placeholder: inputConfig.placeholders.discordServerUrl,
      };
    }

    return { label: 'Start Link', placeholder: 'https://example.com' };
  };

  return (
    <CWTextInput
      label={getStartLinkInputConfig().label}
      name="startLink"
      containerClassName="span-6"
      placeholder={getStartLinkInputConfig().placeholder}
      fullWidth
      {...(defaultValues?.startLink && {
        defaultValue: defaultValues?.startLink,
      })}
      onInput={(e) => onChange?.({ startLink: e?.target?.value?.trim() })}
      customError={errors?.startLink}
    />
  );
};

export default StartLinkInput;
