/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import 'pages/edit_new_profile.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { NewProfile as Profile } from '../../../models';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { AvatarUpload } from '../../components/avatar_upload';
import { CWSpinner } from '../../components/component_kit/cw_spinner';

type GetProfileResponse = {
  profile: any;
};

enum InputFormField {
  Email,
  ProfileName,
  Bio,
  ProfileImage,
  Website,
}

enum EditProfileError {
  None,
  NoProfileFound,
  UpdateProfileFailed,
}

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

type EditNewProfileAttrs = { placeholder?: string };

class EditNewProfile extends ClassComponent<EditNewProfileAttrs> {
  private address: string;
  private error: EditProfileError;
  private failed: boolean;
  private imageUploading: boolean;
  private profile: Profile;
  private profileUpdate: any;
  private saved: boolean;

  private getProfile = async (vnode, address: string) => {
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
    this.profile = Profile.fromJSON(response.profile);
    m.redraw();
  };

  private updateProfile = async () => {
    const response: any = await $.post(`${app.serverUrl()}/updateProfile/v2`, {
      address: this.address,
      ...('email' in this.profileUpdate && {
        email: this.profileUpdate.email,
      }),
      ...('name' in this.profileUpdate && {
        name: this.profileUpdate.name,
      }),
      ...('bio' in this.profileUpdate && {
        bio: this.profileUpdate.bio,
      }),
      ...('avatarUrl' in this.profileUpdate && {
        avatarUrl: this.profileUpdate.avatarUrl,
      }),
      ...('website' in this.profileUpdate && {
        website: this.profileUpdate.website,
      }),
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
      this.saved = true;
      m.redraw();
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

  handleInputChange = (vnode, value, formField: InputFormField) => {
    if (formField === InputFormField.Email) {
      if (value.length > 0 && value !== this.profile?.email)
        this.profileUpdate.email = value;
      else delete this.profileUpdate.email;
    }

    if (formField === InputFormField.ProfileName) {
      if (value.length > 0 && value !== this.profile?.name)
        this.profileUpdate.name = value;
      else delete this.profileUpdate.name;
    }

    if (formField === InputFormField.Bio) {
      if (value.length > 0 && value !== this.profile?.bio)
        this.profileUpdate.bio = value;
      else delete this.profileUpdate.bio;
    }

    if (formField === InputFormField.ProfileImage) {
      if (value.length > 0 && value !== this.profile?.avatarUrl)
        this.profileUpdate.avatarUrl = value;
      else delete this.profileUpdate.avatarUrl;
    }

    if (formField === InputFormField.Website) {
      if (value.length > 0 && value !== this.profile?.website)
        this.profileUpdate.website = value;
      else delete this.profileUpdate.website;
    }
  };

  handleSaveProfile = (vnode) => {
    if (Object.keys(this.profileUpdate).length > 0) {
      this.updateProfile();
    } else {
      this.failed = true;
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

  oninit(vnode) {
    this.address = m.route.param('address');
    this.error = EditProfileError.None;
    this.getProfile(vnode, this.address);

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
    this.saved = false;
    this.failed = false;
    this.imageUploading = false;
  }

  view(vnode) {
    if (this.error === EditProfileError.None)
      return (
        <div className="EditProfilePage">
          <h3> Edit Profile </h3>
          <div className="edit-pane">
            {this.saved || this.imageUploading ? <CWSpinner /> : <div />}

            <div
              className={
                this.failed ? 'save-button-message show' : 'save-button-message'
              }
            >
              <p> No changes saved. </p>
            </div>

            <CWButton
              label={this.saved ? 'Saved!' : 'Save'}
              onclick={() => {
                this.handleSaveProfile(vnode);
              }}
              className={this.saved ? 'save-button confirm' : 'save-button'}
            />

            <div className="general-info">
              <h4 className="title"> General Info </h4>

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
                placeholder={this.profile?.email}
                oninput={(e) => {
                  this.handleInputChange(
                    vnode,
                    (e.target as any).value,
                    InputFormField.Email
                  );
                }}
              />

              <CWTextInput
                name="name-form-field"
                inputValidationFn={(val: string) => {
                  if (val.match(/[^A-Za-z0-9]/)) {
                    return ['failure', 'Must enter characters A-Z'];
                  } else {
                    return ['success', 'Input validated'];
                  }
                }}
                label="Profile Name"
                placeholder={this.profile?.name}
                oninput={(e) => {
                  this.handleInputChange(
                    vnode,
                    (e.target as any).value,
                    InputFormField.ProfileName
                  );
                }}
              />

              <div className="bio-container">
                <label>Bio</label>
                <textarea
                  className="bio-textarea"
                  placeholder={this.profile?.bio}
                  oninput={(e) => {
                    this.handleInputChange(
                      vnode,
                      (e.target as any).value,
                      InputFormField.Bio
                    );
                  }}
                />
              </div>

              <div className="profile-image-section">
                <h4 className="title"> Profile Image </h4>
                <div className="flex">
                  <div
                    className={
                      this.profileUpdate?.avatarUrl
                        ? 'profile-image hide'
                        : 'profile-image'
                    }
                  >
                    <img src={this.profile?.avatarUrl} />
                  </div>
                  <AvatarUpload
                    scope="community"
                    uploadStartedCallback={() => {
                      this.imageUploading = true;
                    }}
                    uploadCompleteBallback={(files) => {
                      this.imageUploading = false;
                      files.forEach((f) => {
                        if (!f.uploadURL) return;
                        const url = f.uploadURL.replace(/\?.*/, '').trim();
                        this.profileUpdate.avatarUrl = url;
                      });
                      m.redraw();
                    }}
                  />

                  <p> OR </p>
                  <CWTextInput
                    name="profile-image-form-field"
                    inputValidationFn={(val: string) => {
                      if (!val.match(/\S+.\S+/)) {
                        return ['failure', 'Must enter valid URL'];
                      } else {
                        return ['success', 'Input validated'];
                      }
                    }}
                    label="Image URL"
                    placeholder={
                      this.profileUpdate?.avatarUrl
                        ? this.profileUpdate?.avatarUrl
                        : this.profile?.avatarUrl
                    }
                    oninput={(e) => {
                      this.handleInputChange(
                        vnode,
                        (e.target as any).value,
                        InputFormField.ProfileImage
                      );
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="social-links">
              <h4 className="title"> Links </h4>
              <CWTextInput
                name="website-form-field"
                inputValidationFn={(val: string) => {
                  if (!val.match(/\S+.\S+/)) {
                    return ['failure', 'Must enter valid website'];
                  } else {
                    return ['success', 'Input validated'];
                  }
                }}
                label="Website"
                placeholder={this.profile?.website}
                oninput={(e) => {
                  this.handleInputChange(
                    vnode,
                    (e.target as any).value,
                    InputFormField.Website
                  );
                }}
              />
            </div>
          </div>
        </div>
      );
  }
}

export default class EditNewProfilePage extends ClassComponent {
  view() {
    return (
      <Sublayout class="Homepage">
        <EditNewProfile />
      </Sublayout>
    );
  }
}
