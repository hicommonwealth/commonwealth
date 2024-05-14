import app from 'client/scripts/state';
import {
  useFetchSelfProfileQuery,
  useUpdateProfileByAddressMutation,
} from 'client/scripts/state/api/profiles';
import {
  PreferenceTags,
  usePreferenceTags,
} from 'client/scripts/views/components/PreferenceTags';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React from 'react';
import './PreferencesStep.scss';

type PreferencesStepProps = {
  onComplete: () => void;
};

const PreferencesStep = ({ onComplete }: PreferencesStepProps) => {
  const { preferenceTags, toggleTagFromSelection } = usePreferenceTags();

  const { mutateAsync: updateProfile, isLoading: isUpdatingProfile } =
    useUpdateProfileByAddressMutation();

  useFetchSelfProfileQuery({
    apiCallEnabled: true,
    updateAddressesOnSuccess: true,
  });

  const handleSavePreferences = () => {
    if (isUpdatingProfile) return;

    updateProfile({
      address: app.user.activeAccount?.profile?.address,
      chain: app.user.activeAccount?.profile?.chain,
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
