import React from 'react';
import { useUpdateUserMutation } from 'state/api/user';
import useUserStore from 'state/ui/user';
import {
  PreferenceTags,
  usePreferenceTags,
} from 'views/components/PreferenceTags';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './PreferencesStep.scss';

type PreferencesStepProps = {
  onComplete: () => void;
};

const PreferencesStep = ({ onComplete }: PreferencesStepProps) => {
  const { preferenceTags, toggleTagFromSelection } = usePreferenceTags();
  const user = useUserStore();
  console.log({ preferenceTags });

  const { mutateAsync: updateUser, isLoading: isUpdatingProfile } =
    useUpdateUserMutation();

  const handleSavePreferences = () => {
    if (isUpdatingProfile) return;

    updateUser({
      id: user.id,
      profile: {},
      tag_ids: preferenceTags
        .filter((tag) => tag.isSelected)
        .map((tag) => tag.item.id),
    })
      .then(() => onComplete())
      .catch(console.error);
  };

  return (
    <section className="PreferencesStep">
      <div className="header">
        <CWText type="h4" fontWeight="semiBold">
          What are you interested in?
        </CWText>
        <CWText type="h5">Select all that apply</CWText>
      </div>

      <PreferenceTags
        preferenceTags={preferenceTags}
        onTagClick={toggleTagFromSelection}
      />

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
