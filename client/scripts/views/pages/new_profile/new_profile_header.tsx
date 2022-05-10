/* @jsx m */

import m from 'mithril';
import app from 'state';
import jdenticon from 'jdenticon';

import { NewProfile as Profile } from 'client/scripts/models'
import { SocialAccount } from 'client/scripts/models';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWButton } from '../../components/component_kit/cw_button'

import 'pages/new_profile.scss';

type ProfileHeaderAttrs = {
  profile: Profile,
  socialAccounts: Array<SocialAccount>,
};

type ProfileHeaderState = {
  isBioExpanded: boolean
}

const DefaultProfileName = "Anonymous"
const DefaultProfileBio = "Happy to be on Commonwealth!"

const maxBioCharCount = 190;
// TODO: Adjust value for responsiveness

const renderSocialAccounts = (socialAccounts: Array<SocialAccount>) => {
    return socialAccounts?.map(account => 
      <div className="social-account-icon">
        {
          account.provider == "github" ? 
            <a href={`https://github.com/${account.username}`} target="_blank"> 
              <CWIcon iconName="github" iconSize="large" /> 
            </a>
          : account.provider == "discord" ? 
            <a href={`https://discordapp.com/users/${account.username}`} target="_blank">
              <CWIcon iconName="discord" iconSize="large" />
            </a>
          : account.provider == "telegram" ? 
            <a href={`https://t.me/${account.username}`} target="_blank">
              <CWIcon iconName="telegram" iconSize="large" />
            </a>
          : <div />
        }
      </div>
    )
}

const renderBio = (bio: string, isExpanded: boolean) => {
  if (!bio)
    return DefaultProfileBio

  if (bio?.length > maxBioCharCount && !isExpanded) {
    return `${bio.slice(0, maxBioCharCount)}...`
  } else {
    return bio
  }
}

class NewProfileHeader implements m.Component<ProfileHeaderAttrs, ProfileHeaderState> {
  
  oninit(vnode) {
    vnode.state.isBioExpanded = false
    vnode.state.defaultAvatar = jdenticon.toSvg(vnode.attrs.address, 90)
  }

  view(vnode) {
    const { profile, socialAccounts, address } = vnode.attrs;

    return(
      <div className="ProfileHeader">
        <CWCard
          interactive={true}
          fullWidth={true}
          className={vnode.state.isBioExpanded ? "profile-info expand" : "profile-info"}
        > 
          <div className="profile-image"> 
            {
              profile?.avatarUrl ? <img src={profile?.avatarUrl} /> : 
              <img src={`data:image/svg+xml;utf8,${encodeURIComponent(vnode.state.defaultAvatar)}`} />
            }
          </div>

          <section className="profile-name-and-bio">
            <h3 className="name"> { profile?.name ? profile.name : DefaultProfileName} </h3>
            <p className="bio"> 
              { 
                renderBio(profile?.bio, vnode.state.isBioExpanded)
              } 
            </p>
            {
              profile?.bio?.length > maxBioCharCount ? 
              <div className="read-more" 
                onclick={() => { vnode.state.isBioExpanded = !vnode.state.isBioExpanded }}
              > 
                <p> 
                  { !vnode.state.isBioExpanded ? "Read More" : "Read Less" } 
                </p> 
              </div>
              : <div />
            }
          </section>

          <section className="social-accounts-and-edit">
            { 
              renderSocialAccounts(socialAccounts)
            }
            {
              app.isLoggedIn() && 
              app.user.addresses.map(addressInfo => addressInfo.address).includes(address) ? 
              <div className="edit-button">
                <CWButton
                  label="Edit"
                  buttonType="primary"
                  onclick={() => m.route.set(`/profile/${m.route.param('address')}/edit`)}
                />
              </div>
              : <div />
            }
          </section>
        </CWCard>

      </div>
    )
  }
}

export default NewProfileHeader;
