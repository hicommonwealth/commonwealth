/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import 'pages/edit_new_profile.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { QuillEditor } from 'views/components/quill/quill_editor';
import { NewProfile as Profile } from '../../../models';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { AvatarUpload } from '../../components/avatar_upload';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { IconName } from '../../components/component_kit/cw_icons/cw_icon_lookup';
import { CWTag } from '../../components/component_kit/cw_tag';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';

type GetProfileResponse = {
  profile: any;
};

enum InputFormField {
  Email,
  Username,
  Bio,
  ProfileImage,
  Website,
  Github,
  Twitter,
  Discord,
  Telegram,
}

enum EditProfileError {
  None,
  NoProfileFound,
  UpdateProfileFailed,
}

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

type EditNewProfileAttrs = { placeholder?: string };

type InputRowAttrs = {
  name: string;
  icon: IconName;
  field: InputFormField;
  placeholder: string;
  handleInputChange: (vnode, value: string, field: InputFormField) => void;
}

type AddressAttrs = {
  address: string;
}

class InputRow extends ClassComponent<InputRowAttrs> {
  view(vnode: m.Vnode<InputRowAttrs>) {
    const { name, icon, field, placeholder, handleInputChange } = vnode.attrs;

    return (
      <div className="input-row">
        <CWTextInput
          name={name}
          inputValidationFn={(val: string) => {
            if (!val.match(/\S+.\S+/)) {
              return ['failure', 'Must enter valid website'];
            } else {
              return ['success', 'Input validated'];
            }
          }}
          iconRight={icon}
          placeholder={placeholder}
          oninput={(e) => {
            handleInputChange(
              vnode,
              (e.target as any).value,
              field,
            );
          }}
        />
        <CWIconButton
          iconButtonTheme="primary"
          iconName="trash"
        />
      </div>
    );
  }
}

class Address extends ClassComponent<AddressAttrs> {
  view(vnode: m.Vnode<AddressAttrs>) {
    const { address } = vnode.attrs;

    return (
      <div className="address">
        <CWTag
          label={address}
          icon="ethereum"
          iconSize="small"
          iconColor="white"
          iconBackgroundColor="primary"
        />
        <CWPopoverMenu
          trigger={
            <CWIconButton iconName="dotsVertical" iconSize="small" />
          }
          menuItems={[
            { label: 'Edit', iconLeft: 'write' },
            { label: 'Delete', iconLeft: 'trash' },
          ]}
        />
      </div>
    )
  }
}

export default class EditNewProfile extends ClassComponent<EditNewProfileAttrs> {
  private address: string;
  private error: EditProfileError;
  private failed: boolean;
  private imageUploading: boolean;
  private profile: Profile;
  private profileUpdate: any;
  private saved: boolean;
  private quillEditorState: QuillEditor;

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

    if (formField === InputFormField.Username) {
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
    if (this.error !== EditProfileError.None) return;

    return (
      <Sublayout class="Homepage">
        <div className="EditProfilePage">
          <div className="header">
            <div>
              <CWText type="h3" fontWeight="medium">Edit Profile</CWText>
              <CWText type="b1">Create and edit profiles and manage your connected addresses.</CWText>
            </div>
            <div className="buttons">
              <CWButton
                label="Delete profile"
                onclick={() => {
                  this.handleSaveProfile(vnode);
                }}
                className={this.saved ? 'save-button confirm' : 'save-button'}
                buttonType="secondary-black"
              />
              <CWButton
                label={this.saved ? 'Saved!' : 'Save'}
                onclick={() => {
                  this.handleSaveProfile(vnode);
                }}
                className={this.saved ? 'save-button confirm' : 'save-button'}
                buttonType="primary-black"
              />
            </div>
          </div>
          <CWDivider />
          <div className="edit-pane">
            {this.saved || this.imageUploading ? <CWSpinner /> : <div />}
            <div
              className={
                this.failed ? 'save-button-message show' : 'save-button-message'
              }
            >
              <p> No changes saved. </p>
            </div>
            <div className="general-info">
              <CWText type="h4">General Info</CWText>
              <div className="columns">
                <div className="left-side">
                  <CWText type="b1">
                    Some helpful text thats makes the user feel welcome. This process will be quick and easy.
                  </CWText>
                </div>
                <div className="right-side">
                  <div className="profile-image-section">
                    <CWText type="caption" fontWeight="medium">Profile Image</CWText>
                    <CWText type="caption" className="description">Select an image from your files to upload</CWText>
                    <div className="image-upload">
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
                    </div>
                  </div>
                  <div className="info-section">
                    <CWTextInput
                      name="username-form-field"
                      inputValidationFn={(val: string) => {
                        if (val.match(/[^A-Za-z0-9]/)) {
                          return ['failure', 'Must enter characters A-Z'];
                        } else {
                          return ['success', 'Input validated'];
                        }
                      }}
                      label="Username"
                      placeholder={this.profile?.name}
                      oninput={(e) => {
                        this.handleInputChange(
                          vnode,
                          (e.target as any).value,
                          InputFormField.Username
                        );
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
                      placeholder={this.profile?.email}
                      oninput={(e) => {
                        this.handleInputChange(
                          vnode,
                          (e.target as any).value,
                          InputFormField.Email
                        );
                      }}
                    />
                  </div>
                  <div className="bio-container">
                    <CWText type="caption">Bio</CWText>
                    <QuillEditorComponent
                      contentsDoc={this.profile?.bio}
                      oncreateBind={(state: QuillEditor) => {
                        this.quillEditorState = state;
                      }}
                      editorNamespace={`${document.location.pathname}-commenting`}
                      imageUploader
                    />
                  </div>
                  <CWDivider />
                  <div className="social-links">
                    <CWText type="b1">Social Links</CWText>
                    <CWText type="caption">
                      Add any of your community's links (Websites, social platforms, etc)
                      These can be added and edited later.
                    </CWText>
                    <InputRow
                      name="twitter-form-field"
                      icon="twitter"
                      field={InputFormField.Twitter}
                      placeholder={this.profile?.twitter}
                      handleInputChange={this.handleInputChange.bind(this)}
                    />
                    <InputRow
                      name="telegram-form-field"
                      icon="telegram"
                      field={InputFormField.Telegram}
                      placeholder={this.profile?.telegram}
                      handleInputChange={this.handleInputChange.bind(this)}
                    />
                    <InputRow
                      name="github-form-field"
                      icon="github"
                      field={InputFormField.Github}
                      placeholder={this.profile?.github}
                      handleInputChange={this.handleInputChange.bind(this)}
                    />
                    <InputRow
                      name="discord-form-field"
                      icon="discord"
                      field={InputFormField.Discord}
                      placeholder={this.profile?.discord}
                      handleInputChange={this.handleInputChange.bind(this)}
                    />
                    <InputRow
                      name="website-form-field"
                      icon="website"
                      field={InputFormField.Website}
                      placeholder={this.profile?.website}
                      handleInputChange={this.handleInputChange.bind(this)}
                    />
                    <div
                      className="add-social-link"
                      onClick={() => {}}
                    >
                      <CWIcon
                        iconName="plus"
                        iconSize="small"
                        onclick={() => {}}
                      />
                      <CWText>
                        Add social link
                      </CWText>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CWDivider />
          <div className="linked-addresses">
            <CWText type="h4" fontWeight="medium">Linked Addresses</CWText>
            <div className="edit-section">
              <div className="description">
                <CWText type="b1">
                  Transfer, Edit and Delete addresses connected to this profile.
                </CWText>
              </div>
              <div className="addresses-container">
                <div className="addresses">
                  <Address address="0x1234567890" />
                  <Address address="0x1234567890" />
                  <Address address="0x1234567890" />
                </div>
                <CWButton
                  iconName="plus"
                  buttonType="mini"
                  label="Connect a New Address"
                  onclick={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </Sublayout>
    );
  }
}