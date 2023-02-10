import React from 'react';
import { useNavigate } from 'react-router-dom';
import jdenticon from 'jdenticon';

import 'components/profile_preview.scss';

import type { AddressInfo, NewProfile as Profile } from 'models';
import { CWText } from './component_kit/cw_text';
import { renderQuillTextBody } from './quill/helpers';
import { SocialAccounts } from './social_accounts';
import { CWButton } from './component_kit/cw_button';
import { LinkedAddresses } from './linked_addresses';
import { LoginModal } from '../modals/login_modal';
import { Modal } from './component_kit/cw_modal';

type ProfilePreviewProps = {
  profiles: Profile[];
  profile: Profile;
  addresses?: AddressInfo[];
  refreshProfiles: () => Promise<void>;
};

const ProfilePreview = (props: ProfilePreviewProps) => {
  const [defaultAvatar, setDefaultAvatar] = React.useState<string>();
  const [isLoginModalOpen, setIsLoginModalOpen] =
    React.useState<boolean>(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    setDefaultAvatar(jdenticon.toSvg(props.profile.id, 90));
  }, []);

  const { profiles, profile, addresses, refreshProfiles } = props;
  const { bio, avatarUrl, username, name } = profile;

  return (
    <div className="ProfilePreview">
      <div className="profile">
        <div className="avatar">
          {avatarUrl ? (
            <img src={avatarUrl} />
          ) : (
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                defaultAvatar
              )}`}
            />
          )}
        </div>
        <div className="content">
          <CWText type="h4">{name || username}</CWText>
          <div className="actions">
            <CWButton
              label="View"
              buttonType="mini-white"
              iconLeft="views"
              onClick={() => navigate(`/profile/${username}`)}
            />
            <CWButton
              label="Edit"
              buttonType="mini-white"
              iconLeft="write"
              onClick={() => navigate(`/profile/${username}/edit`)}
            />
          </div>
          {bio && <CWText>{renderQuillTextBody(bio)}</CWText>}
          <SocialAccounts profile={profile} />
        </div>
        <div className="desktop-actions">
          <CWButton
            label="View"
            buttonType="mini-white"
            iconLeft="views"
            onClick={() => navigate(`/profile/${username}`)}
          />
          <CWButton
            label="Edit"
            buttonType="mini-white"
            iconLeft="write"
            onClick={() => navigate(`/profile/${username}/edit`)}
          />
        </div>
      </div>
      <div className="addresses">
        <div className={addresses.length === 0 ? 'title no-margin' : 'title'}>
          <CWText type="h5">Linked Addresses</CWText>
          <CWButton
            label="Connect Address"
            buttonType="mini-white"
            onClick={() => {
              setIsLoginModalOpen(true);
            }}
            iconLeft="plus"
          />
        </div>
        {addresses && addresses.length > 0 && (
          <LinkedAddresses
            profiles={profiles}
            profile={profile}
            addresses={addresses}
            refreshProfiles={refreshProfiles}
          />
        )}
      </div>
      <Modal
        content={
          <LoginModal
            onModalClose={() => {
              setIsLoginModalOpen(false);
              refreshProfiles();
            }}
          />
        }
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </div>
  );
};

export default ProfilePreview;
