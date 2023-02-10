import React from 'react';
import { useNavigate } from 'react-router-dom';
import jdenticon from 'jdenticon';

import 'pages/new_profile/new_profile_header.scss';

import app from 'state';
import type { NewProfile as Profile } from 'client/scripts/models';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { SocialAccounts } from '../../components/social_accounts';

type NewProfileHeaderProps = {
  profile: Profile;
  isOwner: boolean;
};

const NewProfileHeader = (props: NewProfileHeaderProps) => {
  const navigate = useNavigate();
  const [defaultAvatar, setDefaultAvatar] = React.useState<string>();

  React.useEffect(() => {
    setDefaultAvatar(jdenticon.toSvg(props.profile.id, 90))
  }, []);


  const { profile, isOwner } = props;

  if (!profile) return;
  const { bio, name, username } = profile;

  const isCurrentUser = app.isLoggedIn() && isOwner;

  return (
    <div className="ProfileHeader">
      <div className="edit">
        {isCurrentUser && (
          <CWButton
            label="Edit"
            buttonType="mini-white"
            iconLeft="write"
            onClick={() => navigate(`/profile/${username}/edit`)}
          />
        )}
      </div>
      <div className="profile-image">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} />
        ) : (
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(defaultAvatar)}`}
          />
        )}
      </div>
      <div className="profile-name-and-bio">
        <CWText type="h3" className={name ? 'name hasMargin' : 'name'}>
          {name || username}
        </CWText>
        <div className="buttons">
          {/* TODO: Add delegate and follow buttons */}
          {/* <CWButton label="Delegate" buttonType="mini-black" onClick={() => {}} />
          <CWButton label="Follow" buttonType="mini-black" onClick={() => {}} /> */}
        </div>
        <SocialAccounts profile={profile} />
        {bio && (
          <div>
            <CWText type="h4">Bio</CWText>
            <CWText className="bio">{renderQuillTextBody(bio)}</CWText>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewProfileHeader;
