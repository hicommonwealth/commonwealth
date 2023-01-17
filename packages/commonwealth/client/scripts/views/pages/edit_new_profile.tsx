/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
import _ from 'underscore';

import 'pages/edit_new_profile.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { QuillEditor } from 'views/components/quill/quill_editor';
import { NewProfile as Profile, Account, Profile as OldProfile } from '../../models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { AvatarUpload } from '../components/avatar_upload';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWText } from '../components/component_kit/cw_text';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWForm } from '../components/component_kit/cw_form';
import { CWFormSection } from '../components/component_kit/cw_form_section';
import { CWSocials } from '../components/component_kit/cw_socials';
import CWCoverImageUploader, { ImageAs, ImageBehavior } from '../components/component_kit/cw_cover_image_uploader';

enum EditProfileError {
  None,
  NoProfileFound,
  UpdateProfileFailed,
}

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

type EditNewProfileAttrs = { placeholder?: string };

export type CoverImage = {
  url: string;
  imageAs: ImageAs;
  imageBehavior: ImageBehavior;
}

export default class EditNewProfile extends ClassComponent<EditNewProfileAttrs> {
  private address: string;
  private email: string;
  private error: EditProfileError;
  private failed: boolean;
  private loading: boolean;
  private profile: Profile;
  private profileUpdate: any;
  private socials: string[];
  private username: string;
  private bio: QuillEditor;
  private avatarUrl: string;
  private coverImage: CoverImage;

  private getProfile = async (address: string) => {
    this.loading = true;
    const response: any = await $.get(`${app.serverUrl()}/profile/v2`, {
      address,
      jwt: app.user.jwt,
    }).catch((err: any) => {
      if (
        err.status === 500 &&
        (err.responseJSON.error === NoAddressFoundError ||
          err.responseJSON.error === NoProfileFoundError)
      ) {
        this.error = EditProfileError.NoProfileFound;
        m.route.set(`/profile/${this.address}`); // display error page
      }
      m.redraw();
    });
    this.profile = new Profile(response.profile);
    this.username = this.profile.name;
    this.email = this.profile.email;
    this.socials = this.profile.socials;
    this.avatarUrl = this.profile.avatarUrl;
    this.coverImage = this.profile.coverImage;
    this.loading = false;
    m.redraw();
  };

  private updateProfile = async () => {
    const response: any = await $.post(`${app.serverUrl()}/updateProfile/v2`, {
      address: this.address,
      ...this.profileUpdate,
      jwt: app.user.jwt,
    }).catch(() => {
      this.error = EditProfileError.UpdateProfileFailed;
      this.failed = true;
      setTimeout(() => {
        this.failed = false;
        m.redraw();
      }, 2500);
    });

    if (response?.status === 'Success') {
      // Redirect
      setTimeout(() => {
        m.route.set(`/profile/${this.address}`);
      }, 1500);
    } else {
      this.failed = true;
      setTimeout(() => {
        this.failed = false;
        m.redraw();
      }, 2500);
    }
  };

  private checkForUpdates = () => {
    this.profileUpdate = {};

    if (!_.isEqual(this.email, this.profile?.email))
      this.profileUpdate.email = this.email;

    if (!_.isEqual(this.username, this.profile?.name))
      this.profileUpdate.name = this.username;

    if (!_.isEqual(this.bio.textContentsAsString, this.profile?.bio))
      this.profileUpdate.bio = this.bio.textContentsAsString;

    if (!_.isEqual(this.avatarUrl, this.profile?.avatarUrl))
      this.profileUpdate.avatarUrl = this.avatarUrl;

    if (!_.isEqual(this.socials, this.profile?.socials))
      this.profileUpdate.socials = JSON.stringify(this.socials);

    if (!_.isEqual(this.coverImage, this.profile?.coverImage))
      this.profileUpdate.coverImage = JSON.stringify(this.coverImage);
  };

  private handleSaveProfile = (vnode: m.Vnode<EditNewProfileAttrs>) => {
    this.loading = true;
    this.checkForUpdates();
    if (Object.keys(this.profileUpdate).length > 0) {
      this.updateProfile();
    } else {
      this.failed = true;
      this.loading = false;
      setTimeout(
        () => {
          this.failed = false;
          m.redraw();
        },
        2500,
        vnode
      );
    }
  };

  private handleDeleteProfile = async () => {
    this.loading = true;

    const response: any = await $.post(`${app.serverUrl()}/deleteProfile`, {
      profileId: this.profile.id,
      jwt: app.user.jwt,
    }).catch(() => {
      this.error = EditProfileError.UpdateProfileFailed;
      this.failed = true;
      setTimeout(() => {
        this.failed = false;
        m.redraw();
      }, 2500);
    });

    if (response?.status === 'Success') {
      // Redirect
      setTimeout(() => {
        m.route.set(`/manage-profiles`);
      }, 1500);
    } else {
      this.failed = true;
      setTimeout(() => {
        this.failed = false;
        m.redraw();
      }, 2500);
    }
  };

  oninit() {
    this.address = m.route.param('address');
    this.error = EditProfileError.None;
    this.getProfile(this.address);

    // If not logged in or address not owned by logged in user
    if (
      !app.isLoggedIn() ||
      !app.user.addresses
        .map((addressInfo) => addressInfo.address)
        .includes(this.address)
    ) {
      m.route.set(`/profile/${this.address}`);
    }

    this.profileUpdate = {};
    this.failed = false;
  }

  view(vnode: m.Vnode<EditNewProfileAttrs>) {
    if (this.error !== EditProfileError.None) return;

    if (this.loading) {
      return (
        <div class="EditProfilePage full-height">
          <div class="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      );
    }

    const oldProfile = new OldProfile(
      app.user.addresses[0].profile.name,
      app.user.addresses[0].profile.address,
    );

    oldProfile.initialize(
      this.username,
      null,
      this.bio,
      this.avatarUrl,
      null,
    );

    const account = new Account({
      chain: app.user.addresses[0].chain,
      address: app.user.addresses[0].address,
      profile: oldProfile,
    });

    return (
      <Sublayout class="Homepage">
        <div class="EditProfilePage">
         <CWForm
            title="Edit Profile"
            description="Create and edit profiles and manage your connected addresses."
            actions={
              <div className="buttons-container">
                <div className="buttons">
                  <CWButton
                    label="Delete profile"
                    onclick={() => this.handleDeleteProfile()}
                    buttonType="tertiary-black"
                  />
                  <div className="buttons-right">
                    <CWButton
                      label="Cancel Edits"
                      onclick={() => {
                        this.loading = true;
                        setTimeout(() => {
                          m.route.set(`/profile/${this.address}`);
                        }, 1000);
                      }}
                      className="save-button"
                      buttonType="mini-white"
                    />
                    <CWButton
                      label="Save"
                      onclick={() => {
                        this.handleSaveProfile(vnode);
                      }}
                      className="save-button"
                      buttonType="mini-black"
                    />
                  </div>
                </div>
                <div className="status">
                  <div
                    className={
                      this.failed ? 'save-button-message show' : 'save-button-message'
                    }
                  >
                    <CWText> No changes saved.</CWText>
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
                <CWText type="caption" fontWeight="medium">Profile Image</CWText>
                <CWText type="caption" className="description">Select an image from your files to upload</CWText>
                <div className="image-upload">
                  <AvatarUpload
                    scope="user"
                    account={account}
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
                  label="Username"
                  value={this.username}
                  placeholder="username"
                  oninput={(e) => {
                    this.username = e.target.value;
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
                  Add any of your community's links (Websites, social platforms, etc)
                  These can be added and edited later.
                </CWText>
                <CWSocials
                  socials={this.profile?.socials}
                  handleInputChange={(e) => {
                    this.socials = e
                  }}
                />
              </div>
            </CWFormSection>
            <CWFormSection
              title="Personalize Your Profile"
              description="Express yourself through imagery."
            >
              <CWCoverImageUploader
                uploadCompleteCallback={(url: string, imageAs: ImageAs, imageBehavior: ImageBehavior) => {
                  this.coverImage = {
                    url,
                    imageAs,
                    imageBehavior,
                  };
                }}
                options={true}
              />
            </CWFormSection>
            {/* TODO: Add back in when we have a way to manage addresses */}
            {/* <CWFormSection
              title="Linked Addresses"
              description="Transfer, Edit and Delete addresses connected to this profile."
            >
              <div className="addresses-section">
                <div className="addresses">
                  <Address address="0x1234567890" />
                  <Address address="0x1234567890" />
                  <Address address="0x1234567890" />
                </div>
                <CWButton
                  iconName="plus"
                  buttonType="mini-black"
                  label="Connect a New Address"
                  onclick={() => {}}
                />
              </div>
            </CWFormSection> */}
          </CWForm>
        </div>
      </Sublayout>
    );
  }
}
