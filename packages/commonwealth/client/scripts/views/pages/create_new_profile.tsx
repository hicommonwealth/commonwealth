import React from 'react';
import { useNavigate } from 'react-router-dom';
import $ from 'jquery';

import 'pages/create_new_profile.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { notifyError } from 'controllers/app/notifications';
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
import type { Image } from './edit_new_profile';
import ConfirmCancelNewProfileModal from '../modals/confirm_cancel_new_profile_modal';
import { Modal } from '../components/component_kit/cw_modal';

const CreateNewProfile = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [socials, setSocials] = React.useState<string[]>();
  const [username, setUsername] = React.useState<string>('');
  const [name, setName] = React.useState<string>('');
  const [avatarUrl, setAvatarUrl] = React.useState<string>();
  const [bio, setBio] = React.useState<QuillEditor>();
  const [coverImage, setCoverImage] = React.useState<Image>();
  const [backgroundImage, setBackgroundImage] = React.useState<Image>();
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] =
    React.useState<boolean>(false);

  const createProfile = async (profileUpdates: any) => {
    setLoading(true);

    try {
      const response = await $.post(`${app.serverUrl()}/createProfile`, {
        username,
        ...profileUpdates,
        jwt: app.user.jwt,
      });

      if (response?.status === 'Success') {
        // Redirect
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

  const populateNewProfileFields = () => {
    const newProfileFields: any = {};

    if (username && username !== '') newProfileFields.username = username;
    if (name && name !== '') newProfileFields.name = name;
    if (email && email !== '') newProfileFields.email = email;
    if (avatarUrl) newProfileFields.avatarUrl = avatarUrl;
    if (socials) newProfileFields.socials = JSON.stringify(socials);
    // if (this.bio.textContentsAsString)
    //   this.newProfileFields.bio = this.bio.textContentsAsString;
    if (coverImage) newProfileFields.coverImage = JSON.stringify(coverImage);
    if (backgroundImage)
      newProfileFields.backgroundImage = JSON.stringify(backgroundImage);

    createProfile(newProfileFields);
  };

  const handleCreateProfile = () => {
    setLoading(true);
    populateNewProfileFields();
  };

  React.useEffect(() => {
    if (!app.isLoggedIn()) {
      navigate('/profile/manage');
    }
  }, []);

  if (loading) {
    return (
      <div className="CreateProfilePage full-height">
        <div className="loading-spinner">
          <CWSpinner />
        </div>
      </div>
    );
  }

  return (
    <Sublayout>
      <div className="CreateProfilePage">
        <CWForm
          title="Create Profile"
          description="Add general info and customize your profile."
          actions={
            <div className="buttons-container">
              <CWButton
                label="Cancel"
                onClick={() => {
                  setIsConfirmCancelModalOpen(true);
                }}
                className="save-button"
                buttonType="mini-white"
              />
              <CWButton
                label="Save"
                onClick={() => handleCreateProfile()}
                className="save-button"
                buttonType="mini-black"
                disabled={!username}
              />
            </div>
          }
        >
          <CWFormSection
            title="General Info"
            description="Let your community get to know you by sharing a bit about yourself."
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
                  account={null}
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
                label="Display name"
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
                socials={[]}
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
        <Modal
          content={
            <ConfirmCancelNewProfileModal
              closeModal={() => setIsConfirmCancelModalOpen(false)}
            />
          }
          onClose={() => setIsConfirmCancelModalOpen(false)}
          open={isConfirmCancelModalOpen}
        />
      </div>
    </Sublayout>
  );
};

export default CreateNewProfile;
