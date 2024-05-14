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
import AddressInfo from 'models/AddressInfo';
import React, { useEffect, useRef } from 'react';
import './PreferencesStep.scss';

type PreferencesStepProps = {
  onComplete: () => void;
};

const PreferencesStep = ({ onComplete }: PreferencesStepProps) => {
  const initialTagsSet = useRef(false);
  const { preferenceTags, setPreferenceTags, toggleTagFromSelection } =
    usePreferenceTags({});

  const { mutateAsync: updateProfile, isLoading: isUpdatingProfile } =
    useUpdateProfileByAddressMutation();

  const { data: profile, isLoading } = useFetchSelfProfileQuery({
    apiCallEnabled: true,
  });

  useEffect(() => {
    if (!isLoading && profile && !initialTagsSet.current) {
      const profileTags = profile.tags;
      setPreferenceTags((tags) =>
        [...(tags || [])].map((t) => ({
          ...t,
          isSelected: !!profileTags.find((pt) => pt.id === t.item.id),
        })),
      );
      profile.addresses &&
        app.user.setAddresses(
          profile.addresses.map(
            (a) =>
              new AddressInfo({
                address: a.address,
                communityId: a.community_id,
                id: a.id,
                ghostAddress: a.ghost_address,
                keytype: a.keytype,
                lastActive: a.last_active,
                profileId: a.profile_id,
                walletId: a.wallet_id,
                walletSsoSource: a.wallet_sso_source,
              }),
          ),
        );
      initialTagsSet.current = true;
    }
  }, [profile, isLoading, setPreferenceTags]);

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
