import React from 'react';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { SpecialCaseDynamicFieldsProps } from './types';

const TwitterFields = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  // only render if config allows
  if (!config?.requires_twitter_tweet_link) return <></>;

  return (
    <>
      <CWTextInput
        key={`noOfLikes-${defaultValues?.action}`}
        name="noOfLikes"
        label="Likes Count"
        placeholder="0"
        fullWidth
        {...(defaultValues?.noOfLikes !== 'undefiend' && {
          defaultValue: defaultValues?.noOfLikes,
        })}
        onInput={(e) => onChange?.({ noOfLikes: e?.target?.value?.trim() })}
        customError={errors?.noOfLikes}
        containerClassName="span-2" // this layout comes from QuestActionSubForm.scss
      />
      <CWTextInput
        key={`noOfRetweets-${defaultValues?.action}`}
        name="noOfRetweets"
        label="Retweets Count"
        placeholder="0"
        fullWidth
        {...(defaultValues?.noOfRetweets !== 'undefiend' && {
          defaultValue: defaultValues?.noOfRetweets,
        })}
        onInput={(e) => onChange?.({ noOfRetweets: e?.target?.value?.trim() })}
        customError={errors?.noOfRetweets}
        containerClassName="span-2" // this layout comes from QuestActionSubForm.scss
      />
      <CWTextInput
        key={`noOfReplies-${defaultValues?.action}`}
        name="noOfReplies"
        label="Replies Count"
        placeholder="0"
        fullWidth
        {...(defaultValues?.noOfReplies !== 'undefiend' && {
          defaultValue: defaultValues?.noOfReplies,
        })}
        onInput={(e) => onChange?.({ noOfReplies: e?.target?.value?.trim() })}
        customError={errors?.noOfReplies}
        containerClassName="span-2" // this layout comes from QuestActionSubForm.scss
      />
    </>
  );
};

export default TwitterFields;
