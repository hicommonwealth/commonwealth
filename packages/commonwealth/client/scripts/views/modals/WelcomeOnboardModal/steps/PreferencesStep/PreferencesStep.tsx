import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import clsx from 'clsx';
import React, { useState } from 'react';
import './PreferencesStep.scss';
import { interestTags } from './constants';

type PreferencesStepProps = {
  onComplete: () => void;
};

const PreferencesStep = ({ onComplete }: PreferencesStepProps) => {
  const [selectedTags, setSelectedTags] = useState(
    [...interestTags].map((tag) => ({ isSelected: false, tag })),
  );

  const toggleTagFromSelection = (tag: string, isSelected: boolean) => {
    const updatedTags = [...selectedTags];
    const foundTag = updatedTags.find((t) => t.tag === tag);
    foundTag.isSelected = isSelected;
    setSelectedTags([...updatedTags]);
  };

  const handleSavePreferences = () => {
    // TODO: save tags to api here
    // const finalTags = selectedTags.filter(tag => tag.isSelected)

    onComplete();
  };

  return (
    <section className="PreferencesStep">
      <div className="header">
        <CWText type="h4" fontWeight="semiBold">
          What are you interested in?
        </CWText>
        <CWText type="h5">Select all that apply</CWText>
      </div>

      <div className="tags-container">
        {selectedTags.map(({ tag, isSelected }) => (
          <CWButton
            key={tag}
            label={tag}
            buttonType="secondary"
            buttonHeight="sm"
            buttonWidth="narrow"
            containerClassName={clsx('tag', { isSelected })}
            onClick={() => toggleTagFromSelection(tag, !isSelected)}
          />
        ))}
      </div>

      <div className="action-btns">
        <CWButton
          label="Later"
          onClick={onComplete}
          buttonType="secondary"
          buttonWidth="full"
        />
        <CWButton
          label="Next"
          onClick={handleSavePreferences}
          buttonWidth="full"
        />
      </div>
    </section>
  );
};

export { PreferencesStep };
