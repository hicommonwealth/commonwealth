import React from 'react';
import { useNavigate } from 'react-router-dom';
import $ from 'jquery';
import _ from 'underscore';

import 'components/edit_profile.scss';

import app from 'state';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { notifyError } from 'controllers/app/notifications';
import {
  NewProfile as Profile,
  Account,
  Profile as OldProfile,
  AddressInfo,
} from '../../models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { AvatarUpload } from '../components/avatar_upload';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWText } from '../components/component_kit/cw_text';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWForm } from '../components/component_kit/cw_form';
import { CWFormSection } from '../components/component_kit/cw_form_section';
import { CWSocials } from '../components/component_kit/cw_socials';
import type { ImageBehavior } from '../components/component_kit/cw_cover_image_uploader';
import { CWCoverImageUploader } from '../components/component_kit/cw_cover_image_uploader';
import { PageNotFound } from '../pages/404';

enum EditProfileError {
  None,
  NoProfileFound,
}

const NoProfileFoundError = 'No profile found';

type EditNewProfileProps = {
  profileId: string;
};

export type Image = {
  url: string;
  imageBehavior: ImageBehavior;
};

const EditProfileComponent = (props: EditNewProfileProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState<string>('');
  const [error, setError] = React.useState<EditProfileError>(
    EditProfileError.None
  );
  const [loading, setLoading] = React.useState<boolean>(true);
  const [socials, setSocials] = React.useState<string[]>();
  const [profile, setProfile] = React.useState<Profile>();
  const [username, setUsername] = React.useState<string>('');
  const [name, setName] = React.useState<string>('');
  const [avatarUrl, setAvatarUrl] = React.useState<string>();
  const [bio, setBio] = React.useState<QuillEditor>();
  const [addresses, setAddresses] = React.useState<AddressInfo[]>();
  const [isOwner, setIsOwner] = React.useState<boolean>();
  const [coverImage, setCoverImage] = React.useState<Image>();
  const [backgroundImage, setBackgroundImage] = React.useState<Image>();
  const coverImageRef = React.useRef<Image>();
  coverImageRef.current = coverImage;
  const backgroundImageRef = React.useRef<Image>();
  backgroundImageRef.current = backgroundImage;

  const getProfile = async (query: string) => {
    try {
      const { result } = await $.get(`${app.serverUrl()}/profile/v2`, {
        profileId: query,
        jwt: app.user.jwt,
      });

      setProfile(new Profile(result.profile));
      setName(result.profile.profile_name || '');
      setUsername(result.profile.username || '');
      setEmail(result.profile.email || '');
      setSocials(result.profile.socials);
      setAvatarUrl(result.profile.avatar_url);
      setCoverImage(result.profile.cover_image);
      setBackgroundImage(result.profile.background_image);
      setAddresses(
        result.addresses.map(
          (a) =>
            new AddressInfo(
              a.id,
              a.address,
              a.chain,
              a.keytype,
              a.wallet_id,
              a.ghost_address
            )
        )
      );
      setIsOwner(result.isOwner);
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON?.error === NoProfileFoundError
      ) {
        setError(EditProfileError.NoProfileFound);
      }
    }
    setLoading(false);
  };

  const updateProfile = async (profileUpdate: any) => {
    try {
      const { result } = await $.post(`${app.serverUrl()}/updateProfile/v2`, {
        profileId: profile.id,
        ...profileUpdate,
        jwt: app.user.jwt,
      });

      if (result?.status === 'Success') {
        setTimeout(() => {
          setLoading(false);
          navigate(`/profile/${username}`);
        }, 1500);
      }
    } catch (err) {
      setTimeout(() => {
        setLoading(false);
        notifyError(err.responseJSON?.error || 'Something went wrong.');
      }, 1500);
    }
  };

  const checkForUpdates = () => {
    const profileUpdate: any = {};

    if (!_.isEqual(username, profile?.username) && username !== '')
      profileUpdate.username = username;

    if (!_.isEqual(name, profile?.name) && name !== '')
      profileUpdate.name = name;

    if (!_.isEqual(email, profile?.email) && email !== '')
      profileUpdate.email = email;

    // if (!_.isEqual(this.bio.textContentsAsString, this.profile?.bio))
    //   this.profileUpdate.bio = this.bio.textContentsAsString;

    if (!_.isEqual(avatarUrl, profile?.avatarUrl))
      profileUpdate.avatarUrl = avatarUrl;

    if (!_.isEqual(socials, profile?.socials))
      profileUpdate.socials = JSON.stringify(socials);

    if (!_.isEqual(coverImageRef.current, profile?.coverImage))
      profileUpdate.coverImage = JSON.stringify(coverImageRef.current);

    if (!_.isEqual(backgroundImageRef.current, profile?.backgroundImage))
      profileUpdate.backgroundImage = JSON.stringify(
        backgroundImageRef.current
      );

    if (Object.keys(profileUpdate)?.length > 0) {
      updateProfile(profileUpdate);
    } else {
      setTimeout(() => {
        setLoading(false);
        notifyError('No updates found.');
      }, 1500);
    }
  };

  const handleSaveProfile = () => {
    setLoading(true);
    checkForUpdates();
  };

  const handleDeleteProfile = async () => {
    if (addresses?.length > 0) {
      notifyError(
        'You must unlink all addresses before deleting your profile.'
      );
      return;
    }

    setLoading(true);

    try {
      const response: any = await $.post(`${app.serverUrl()}/deleteProfile`, {
        profileId: profile.id,
        jwt: app.user.jwt,
      });
      if (response?.status === 'Success') {
        // Redirect
        setTimeout(() => {
          setLoading(false);
          navigate('/profile/manage');
        }, 1500);
      }
    } catch (err) {
      setTimeout(() => {
        setLoading(false);
        notifyError(err.responseJSON?.error || 'Something went wrong.');
      }, 1500);
    }
  };

  React.useEffect(() => {
    if (!app.isLoggedIn()) {
      navigate(`/profile/id/${props.profileId}`);
    }

    if (props.profileId) {
      getProfile(props.profileId);
    }
  }, []);

  if (loading) {
    return (
      <div className="EditProfile full-height">
        <div className="loading-spinner">
          <CWSpinner />
        </div>
      </div>
    );
  }

  if (error === EditProfileError.NoProfileFound) {
    return <PageNotFound message="We cannot find profile." />;
  }

  if (error === EditProfileError.None) {
    if (!isOwner) {
      navigate(`/profile/id/${props.profileId}`);
    }

    // need to create an account to pass to AvatarUpload to see last upload
    // not the best solution because address is not always available
    // should refactor AvatarUpload to make it work with new profiles
    let account: Account | null;
    if (addresses?.length > 0) {
      const oldProfile = new OldProfile(
        addresses[0].chain.name,
        addresses[0].address
      );

      oldProfile.initialize(username, null, bio, avatarUrl, null);

      account = new Account({
        chain: addresses[0].chain,
        address: addresses[0].address,
        profile: oldProfile,
      });
    } else {
      account = null;
    }

    return (
      <div className="EditProfile">
        <CWForm
          title="Edit Profile"
          description="Create and edit profiles and manage your connected addresses."
          actions={
            <div className="buttons-container">
              <div className="buttons">
                <CWButton
                  label="Delete profile"
                  onClick={() => handleDeleteProfile()}
                  buttonType="tertiary-black"
                />
                <div className="buttons-right">
                  <CWButton
                    label="Cancel Edits"
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        navigate(`/profile/${props.username}`);
                      }, 1000);
                    }}
                    className="save-button"
                    buttonType="mini-white"
                  />
                  <CWButton
                    label="Save"
                    onClick={() => {
                      handleSaveProfile();
                    }}
                    className="save-button"
                    buttonType="mini-black"
                  />
                </div>
              </div>
            </div>
          }
        >
          <CWFormSection
            title="General Info"
            description="Some helpful text that makes the user feel welcome. This process will be quick and easy."
          >
            <div className="profile-image-section">
              <CWText type="caption" fontWeight="medium">
                Profile Image
              </CWText>
              <CWText type="caption" className="description">
                Select an image from your files to upload
              </CWText>
              <div className="image-upload">
                <AvatarUpload
                  scope="user"
                  account={account}
                  uploadCompleteCallback={(file) => {
                    if (!file.uploadURL) return;
                    const url = file.uploadURL.replace(/\?.*/, '').trim();
                    setAvatarUrl(url);
                  }}
                />
              </div>
            </div>
            <div className="info-section">
              <CWTextInput
                name="username-form-field"
                inputValidationFn={(val: string) => {
                  if (val.match(/[^A-Za-z0-9]/)) {
                    return ['failure', 'Must enter characters A-Z, 0-9'];
                  } else {
                    return ['success', 'Input validated'];
                  }
                }}
                label={
                  <CWText type="caption" className="username">
                    Username <span className="blue-star">&nbsp;*</span>
                  </CWText>
                }
                value={username}
                placeholder="username"
                onInput={(e) => {
                  setUsername(e.target.value);
                }}
              />
              <CWTextInput
                name="name-form-field"
                inputValidationFn={(val: string) => {
                  if (val.match(/[^A-Za-z0-9]/)) {
                    return ['failure', 'Must enter characters A-Z, 0-9'];
                  } else {
                    return ['success', 'Input validated'];
                  }
                }}
                label="Display Name"
                value={name}
                placeholder="display name"
                onInput={(e) => {
                  setName(e.target.value);
                }}
              />
              <CWTextInput
                name="email-form-field"
                inputValidationFn={(val: string) => {
                  if (!val.match(/\S+@\S+\.\S+/)) {
                    return ['failure', 'Must enter valid email'];
                  } else {
                    return ['success', 'Input validated'];
                  }
                }}
                label="Email"
                value={email}
                placeholder="email"
                onInput={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </div>
            <div className="bio-section">
              <CWText type="caption">Bio</CWText>
              <QuillEditorComponent
                contentsDoc={profile?.bio}
                oncreateBind={(state: QuillEditor) => {
                  setBio(state);
                }}
                editorNamespace={`${document.location.pathname}-bio`}
                imageUploader
              />
            </div>
            <CWDivider />
            <div className="socials-section">
              <CWText type="b1">Social Links</CWText>
              <CWText type="caption">
                Add any of your community's links (Websites, social platforms,
                etc) These can be added and edited later.
              </CWText>
              <CWSocials
                socials={profile?.socials}
                handleInputChange={(e) => {
                  setSocials(e);
                }}
              />
            </div>
          </CWFormSection>
          <CWFormSection
            title="Personalize Your Profile"
            description="Express yourself through imagery."
          >
            <CWText fontWeight="medium">Cover Image</CWText>
            <CWCoverImageUploader
              uploadCompleteCallback={(
                url: string,
                imageBehavior: ImageBehavior
              ) => {
                setCoverImage({
                  url,
                  imageBehavior,
                });
              }}
              generatedImageCallback={(
                url: string,
                imageBehavior: ImageBehavior
              ) => {
                setCoverImage({
                  url,
                  imageBehavior,
                });
              }}
              enableGenerativeAI
              defaultImageUrl={coverImage?.url}
              defaultImageBehavior={coverImage?.imageBehavior}
            />
            <CWDivider />
            <CWText fontWeight="medium">Background Image</CWText>
            <CWCoverImageUploader
              uploadCompleteCallback={(
                url: string,
                imageBehavior: ImageBehavior
              ) => {
                setBackgroundImage({
                  url,
                  imageBehavior,
                });
              }}
              generatedImageCallback={(
                url: string,
                imageBehavior: ImageBehavior
              ) => {
                setBackgroundImage({
                  url,
                  imageBehavior,
                });
              }}
              enableGenerativeAI
              defaultImageUrl={backgroundImage?.url}
              defaultImageBehavior={backgroundImage?.imageBehavior}
            />
          </CWFormSection>
        </CWForm>
      </div>
    );
  }
};

export default EditProfileComponent;
