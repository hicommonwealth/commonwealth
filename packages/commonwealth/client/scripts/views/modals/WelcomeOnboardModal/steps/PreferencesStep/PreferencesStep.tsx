import app from 'client/scripts/state';
import { useUpdateProfileByAddressMutation } from 'client/scripts/state/api/profiles';
import {
  PreferenceTags,
  usePreferenceTags,
} from 'client/scripts/views/components/PreferenceTags';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React from 'react';
import './PreferencesStep.scss';
import useUserStore from 'client/scripts/state/ui/user';

type PreferencesStepProps = {
  onComplete: () => void;
};

const PreferencesStep = ({ onComplete }: PreferencesStepProps) => {
  const { preferenceTags, toggleTagFromSelection } = usePreferenceTags();
  const user = useUserStore();

  const { mutateAsync: updateProfile, isLoading: isUpdatingProfile } =
    useUpdateProfileByAddressMutation();

  const handleSavePreferences = () => {
    if (isUpdatingProfile) return;

    updateProfile({
      address: user.activeAccount?.profile?.address || '',
      chain: user.activeAccount?.profile?.chain || '',
      tagIds: preferenceTags
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
