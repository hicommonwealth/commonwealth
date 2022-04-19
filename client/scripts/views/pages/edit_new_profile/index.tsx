/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import Sublayout from 'views/sublayout';

import { NewProfile as Profile } from '../../../../scripts/models'
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput, ValidationStatus } from '../../components/component_kit/cw_text_input';

import 'pages/edit_new_profile.scss';

type EditProfileState = {
  address: string,
  profile: Profile,
}

class EditNewProfile implements m.Component<{}, EditProfileState> {

  oninit(vnode) {
    vnode.state.address = m.route.param("address")
    this.getProfile(vnode, vnode.state.address)
  }

  getProfile = async (vnode, address: string) => {
    const response = await $.get(`${app.serverUrl()}/profile/v2`, {
      address,
      jwt: app.user.jwt,
    });
    // TODO : Error handling
    vnode.state.profile = Profile.fromJSON(response.profile) 
  }

  updateProfile = async (vnode) => {
    const response = await $.get(`${app.serverUrl()}/updateProfile/v2`, {
      address: vnode.state.address,  
      bio: "Ruining my bio",
    })
    vnode.state.profile = response.profile
    console.log(vnode.state.profile)
    // TODO : Error handling
  }

  handleSaveProfile = (vnode) => {
    this.updateProfile(vnode)
    // Redirect
    // m.route.set(`profile/${vnode.state.address}}`)
  }

  addLineBreaks = (text: string) => {
    // TODO
    return text
  }

  view(vnode) {
    return (
      <div className="EditProfilePage">
        <h3> Edit Profile </h3>
        <div className="edit-pane">

          <CWButton         
            label="Save"
            buttonType="primary"
            onclick={()=>{ this.handleSaveProfile(vnode) }} 
            className="save-button"
          />

          <div className="general-info">
            <h4 className="title"> General Info </h4>

            <CWTextInput
              name="email-form-field"
              inputValidationFn={(val: string): [ValidationStatus, string] => {
                if (val.match(/[^A-Za-z@.]/)) {
                  return [ValidationStatus.Failure, 'Must enter characters A-Z'];
                } else {
                  return [ValidationStatus.Success, 'Input validated'];
                }
              }}
              label="Email"
              placeholder={vnode.state.profile?.email}
            />
          
            <CWTextInput
              name="slug-form-field"
              inputValidationFn={(val: string): [ValidationStatus, string] => {
                if (val.match(/[^A-Za-z0-9]/)) {
                  return [ValidationStatus.Failure, 'Must enter characters A-Z'];
                } else {
                  return [ValidationStatus.Success, 'Input validated'];
                }
              }}
              label="Profile Name"
              placeholder={vnode.state.profile?.slug}
            />

            <CWTextInput
              name="bio-form-field"
              inputValidationFn={(val: string): [ValidationStatus, string] => {
                if (val.match(/[^A-Za-z@.0-9*#]/)) {
                  return [ValidationStatus.Failure, 'Must enter characters A-Z'];
                } else {
                  return [ValidationStatus.Success, 'Input validated'];
                }
              }}
              label="Bio"
              placeholder={this.addLineBreaks(vnode.state.profile?.bio)}
            />

            <div className="profile-image-section">
              <h4 className="title"> Profile Image </h4>
              <div className="flex">
                <div className="profile-image">
                  <img src={vnode.state.profile?.avatarUrl} />
                </div>
                <p> OR </p>
                <CWTextInput
                  name="profile-image-form-field"
                  inputValidationFn={(val: string): [ValidationStatus, string] => {
                    if (val.match(/[^A-Za-z@.0-9*#]/)) {
                      return [ValidationStatus.Failure, 'Must enter characters A-Z'];
                    } else {
                      return [ValidationStatus.Success, 'Input validated'];
                    }
                  }}
                  label="Image URL"
                  placeholder={vnode.state.profile?.avatarUrl}
                />
              </div>
            </div>

          </div>
          <div className="social-links">
            <h4 className="title"> Links </h4>

            <CWTextInput
              name="website-form-field"
              inputValidationFn={(val: string): [ValidationStatus, string] => {
                if (val.match(/[^A-Za-z@.]/)) {
                  return [ValidationStatus.Failure, 'Must enter characters A-Z'];
                } else {
                  return [ValidationStatus.Success, 'Input validated'];
                }
              }}
              label="Website"
              placeholder={vnode.state.profile?.website}
            />

          </div>
        </div>        
      </div>
    )
  }
}

const EditNewProfilePage: m.Component = {
  view: () => {
    return m(
      Sublayout,
      {
        class: 'Homepage',
      },
      [m(EditNewProfile)]
    );
  },
};

export default EditNewProfilePage;