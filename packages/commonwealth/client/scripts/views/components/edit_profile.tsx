/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
import _ from 'underscore';

import 'components/edit_profile.scss';

import app from 'state';
import { navigateToSubpage } from 'router';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import {
  NewProfile as Profile,
  Account,
  MinimumProfile,
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
import CWCoverImageUploader from '../components/component_kit/cw_cover_image_uploader';
import { PageNotFound } from '../pages/404';
import { LinkedAddresses } from './linked_addresses';
import { NewLoginModal } from '../modals/login_modal';

enum EditProfileError {
  None,
  NoProfileFound,
}

const NoProfileFoundError = 'No profile found';

type EditNewProfileAttrs = {
  profileId: string;
};

export type Image = {
  url: string;
  imageBehavior: ImageBehavior;
};

export default class EditProfileComponent extends ClassComponent<EditNewProfileAttrs> {
  private email: string;
  private error: EditProfileError;
  private loading: boolean;
  private profile: Profile;
  private profileUpdate: any;
  private socials: string[];
  private name: string;
  private bio: QuillEditor;
  private avatarUrl: string;
  private addresses: AddressInfo[];
  private isOwner: boolean;
  private coverImage: Image;
  private backgroundImage: Image;

  private getProfile = async (profileId: string) => {
    this.loading = true;
    try {
      const { result } = await $.get(`${app.serverUrl()}/profile/v2`, {
        profileId,
        jwt: app.user.jwt,
      });

      this.profile = new Profile(result.profile);
      this.name = this.profile.name;
      this.email = this.profile.email;
      this.socials = this.profile.socials;
      this.avatarUrl = this.profile.avatarUrl;
      this.coverImage = this.profile.coverImage;
      this.backgroundImage = this.profile.backgroundImage;
      this.addresses = result.addresses.map(
        (a) =>
          new AddressInfo(
            a.id,
            a.address,
            a.chain,
            a.keytype,
            a.wallet_id,
            a.ghost_address
          )
      );
      this.isOwner = result.isOwner;
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON?.error === NoProfileFoundError
      ) {
        this.error = EditProfileError.NoProfileFound;
      }
    }
    this.loading = false;
    m.redraw();
  };

  private updateProfile = async () => {
    try {
      const response: any = await $.post(
        `${app.serverUrl()}/updateProfile/v2`,
        {
          ...this.profileUpdate,
          jwt: app.user.jwt,
        }
      );

      if (response?.result?.status === 'Success') {
        // refresh profile in store
        app.newProfiles.updateProfileForAccount(
          this.addresses[0].address,
          this.profileUpdate
        );
        setTimeout(() => {
          this.loading = false;
          navigateToSubpage(`/profile/id/${this.profile.id}`);
        }, 1500);
      }
    } catch (err) {
      setTimeout(() => {
        this.loading = false;
        notifyError(err.responseJSON?.error || 'Something went wrong.');
      }, 1500);
    }
  };

  private checkForUpdates = () => {
    this.profileUpdate = {};

    if (!_.isEqual(this.name, this.profile?.name))
      this.profileUpdate.name = this.name;

    if (!_.isEqual(this.email, this.profile?.email))
      this.profileUpdate.email = this.email;

    if (!_.isEqual(this.bio.textContentsAsString, this.profile?.bio))
      this.profileUpdate.bio = this.bio.textContentsAsString;

    if (!_.isEqual(this.avatarUrl, this.profile?.avatarUrl))
      this.profileUpdate.avatarUrl = this.avatarUrl;

    if (!_.isEqual(this.socials, this.profile?.socials))
      this.profileUpdate.socials = JSON.stringify(this.socials);

    if (!_.isEqual(this.coverImage, this.profile?.coverImage))
      this.profileUpdate.coverImage = JSON.stringify(this.coverImage);

    if (!_.isEqual(this.backgroundImage, this.profile?.backgroundImage))
      this.profileUpdate.backgroundImage = JSON.stringify(this.backgroundImage);
  };

  private handleSaveProfile = () => {
    this.loading = true;
    this.checkForUpdates();
    if (Object.keys(this.profileUpdate).length > 0) {
      this.updateProfile();
    } else {
      setTimeout(() => {
        this.loading = false;
        notifyError('No updates found.');
      }, 1500);
    }
  };

  oninit(vnode) {
    this.error = EditProfileError.None;
    this.getProfile(vnode.attrs.profileId);
    this.profileUpdate = {};
  }

  view(vnode) {
    if (this.loading) {
      return (
        <div class="EditProfile full-height">
          <div class="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      );
    }

    if (this.error === EditProfileError.NoProfileFound)
      return <PageNotFound message="We cannot find this profile." />;

    if (this.error === EditProfileError.None) {
      if (!this.isOwner) {
        navigateToSubpage(`/profile/id/${vnode.attrs.profileId}`);
      }

      // need to create an account to pass to AvatarUpload to see last upload
      // not the best solution because address is not always available
      // should refactor AvatarUpload to make it work with new profiles
      let account: Account | null;
      if (this.addresses.length > 0) {
        const oldProfile = new MinimumProfile(
          this.addresses[0].chain.name,
          this.addresses[0].address
        );

        oldProfile.initialize(
          this.name,
          this.addresses[0].address,
          this.avatarUrl,
          this.profile.id,
          this.addresses[0].chain.name,
          null
        );

        account = new Account({
          chain: this.addresses[0].chain,
          address: this.addresses[0].address,
          profile: oldProfile,
        });
      } else {
        account = null;
      }

      return (
        <div class="EditProfile">
          <CWForm
            title="Edit Profile"
            description="Create and edit profiles and manage your connected addresses."
            actions={
              <div className="buttons-container">
                <div className="buttons">
                  <CWButton
                    label="Cancel Edits"
                    onclick={() => {
                      this.loading = true;
                      setTimeout(() => {
                        navigateToSubpage(`/profile/id/${this.profile.id}`);
                      }, 1000);
                    }}
                    className="save-button"
                    buttonType="mini-white"
                  />
                  <CWButton
                    label="Save"
                    onclick={() => {
                      this.handleSaveProfile();
                    }}
                    className="save-button"
                    buttonType="mini-black"
                  />
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
                  name="name-form-field"
                  inputValidationFn={(val: string) => {
                    if (val.match(/[^A-Za-z0-9]/)) {
                      return ['failure', 'Must enter characters A-Z, 0-9'];
                    } else {
                      return ['success', 'Input validated'];
                    }
                  }}
                  label="Display Name"
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
            <CWFormSection
              title="Linked Addresses"
              description="Manage your addresses."
            >
              <LinkedAddresses
                addresses={this.addresses}
                profile={this.profile}
                refreshProfiles={() => this.getProfile(vnode.attrs.profileId)}
              />
              <CWDivider />
              <div className="connect-address-container">
                <CWButton
                  label="Connect Address"
                  buttonType="mini-white"
                  onclick={() => {
                    app.modals.create({
                      modal: NewLoginModal,
                      exitCallback: () => {
                        setTimeout(() => {
                          notifySuccess(
                            'Address has been successfully connected.'
                          );
                        }, 1000);
                        this.getProfile(vnode.attrs.profileId);
                      },
                    });
                  }}
                  iconLeft="plus"
                />
              </div>
            </CWFormSection>
          </CWForm>
        </div>
      );
    }
  }
}
