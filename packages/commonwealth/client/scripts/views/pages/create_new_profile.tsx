/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import 'pages/create_new_profile.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import Sublayout from 'views/sublayout';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { QuillEditor } from 'views/components/quill/quill_editor';
import { notifyError } from 'controllers/app/notifications';
import { NewProfile as Profile } from '../../models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { AvatarUpload } from '../components/avatar_upload';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWText } from '../components/component_kit/cw_text';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWForm } from '../components/component_kit/cw_form';
import { CWFormSection } from '../components/component_kit/cw_form_section';
import { CWSocials } from '../components/component_kit/cw_socials';
import CWCoverImageUploader, {
  ImageBehavior,
} from '../components/component_kit/cw_cover_image_uploader';
import { Image } from './edit_new_profile';
import { ConfirmCancelNewProfileModal } from '../modals/confirm_cancel_new_profile_modal';

export default class CreateNewProfile extends ClassComponent {
  private email: string;
  private loading: boolean;
  private profile: Profile;
  private newProfile: any;
  private socials: string[];
  private username: string;
  private name: string;
  private bio: QuillEditor;
  private avatarUrl: string;
  private coverImage: Image;
  private backgroundImage: Image;

  private createProfile = async () => {
    this.loading = true;

    try {
      const response = await $.post(`${app.serverUrl()}/createProfile`, {
        username: this.username,
        ...this.newProfile,
        jwt: app.user.jwt,
      });

      if (response?.status === 'Success') {
        // Redirect
        setTimeout(() => {
          this.loading = false;
          m.route.set(`/profile/${this.username}`);
        }, 1500);
      }
    } catch (err) {
      setTimeout(() => {
        this.loading = false;
        notifyError(err.responseJSON?.error || 'Something went wrong.');
      }, 1500);
    }
    m.redraw();
  };

  private populateNewProfileFields = () => {
    this.newProfile = {};

    if (this.username) this.newProfile.username = this.username;
    if (this.name) this.newProfile.name = this.name;
    if (this.email) this.newProfile.email = this.email;
    if (this.avatarUrl) this.newProfile.avatarUrl = this.avatarUrl;
    if (this.socials) this.newProfile.socials = JSON.stringify(this.socials);
    if (this.bio.textContentsAsString)
      this.newProfile.bio = this.bio.textContentsAsString;
    if (this.coverImage)
      this.newProfile.coverImage = JSON.stringify(this.coverImage);
    if (this.backgroundImage)
      this.newProfile.backgroundImage = JSON.stringify(this.backgroundImage);
  };

  private handleCreateProfile = () => {
    this.loading = true;
    this.populateNewProfileFields();
    this.createProfile();
  };

  oninit() {
    if (!app.isLoggedIn()) {
      navigateToSubpage('/profile/manage');
    }

    this.loading = false;
    this.newProfile = {};
  }

  view() {
    if (this.loading) {
      return (
        <div class="CreateProfilePage full-height">
          <div class="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      );
    }

    return (
      <Sublayout class="Homepage">
        <div class="CreateProfilePage">
          <CWForm
            title="Create Profile"
            description="Add general info and customize your profile."
            actions={
              <div className="buttons-container">
                <CWButton
                  label="Cancel"
                  onclick={() => {
                    app.modals.create({ modal: ConfirmCancelNewProfileModal });
                  }}
                  className="save-button"
                  buttonType="mini-white"
                />
                <CWButton
                  label="Save"
                  onclick={() => this.handleCreateProfile()}
                  className="save-button"
                  buttonType="mini-black"
                  disabled={!this.username}
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
                    uploadCompleteCallback={(files) => {
                      files.forEach((f) => {
                        if (!f.uploadURL) return;
                        const url = f.uploadURL.replace(/\?.*/, '').trim();
                        this.avatarUrl = url;
                      });
                      m.redraw();
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
                  value={this.username}
                  placeholder="username"
                  oninput={(e) => {
                    this.username = e.target.value;
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
                  value={this.name}
                  placeholder="display name"
                  oninput={(e) => {
                    this.name = e.target.value;
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
                  value={this.email}
                  placeholder="email"
                  oninput={(e) => {
                    this.email = e.target.value;
                  }}
                />
              </div>
              <div className="bio-section">
                <CWText type="caption">Bio</CWText>
                <QuillEditorComponent
                  contentsDoc={this.profile?.bio}
                  oncreateBind={(state: QuillEditor) => {
                    this.bio = state;
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
                  socials={this.profile?.socials}
                  handleInputChange={(e) => {
                    this.socials = e;
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
                name="cover-image-uploader"
                uploadCompleteCallback={(
                  url: string,
                  imageBehavior: ImageBehavior
                ) => {
                  this.coverImage = {
                    url,
                    imageBehavior,
                  };
                }}
                generatedImageCallback={(
                  url: string,
                  imageBehavior: ImageBehavior
                ) => {
                  this.coverImage = {
                    url,
                    imageBehavior,
                  };
                }}
                enableGenerativeAI
                defaultImageUrl={this.coverImage?.url}
                defaultImageBehavior={this.coverImage?.imageBehavior}
              />
              <CWDivider />
              <CWText fontWeight="medium">Background Image</CWText>
              <CWCoverImageUploader
                name="background-image-uploader"
                uploadCompleteCallback={(
                  url: string,
                  imageBehavior: ImageBehavior
                ) => {
                  this.backgroundImage = {
                    url,
                    imageBehavior,
                  };
                }}
                generatedImageCallback={(
                  url: string,
                  imageBehavior: ImageBehavior
                ) => {
                  this.backgroundImage = {
                    url,
                    imageBehavior,
                  };
                }}
                enableGenerativeAI
                defaultImageUrl={this.backgroundImage?.url}
                defaultImageBehavior={this.backgroundImage?.imageBehavior}
              />
            </CWFormSection>
          </CWForm>
        </div>
      </Sublayout>
    );
  }
}
