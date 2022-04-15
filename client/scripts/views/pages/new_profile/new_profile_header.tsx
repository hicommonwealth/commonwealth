/* @jsx m */

import m from 'mithril';

import { NewProfile as Profile } from 'client/scripts/models'
import { SocialAccount } from 'client/scripts/models';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

import 'pages/new_profile.scss';

type ProfileHeaderAttrs = {
  profile: Profile,
  socialAccounts: Array<SocialAccount>,
};

const renderSocialAccounts = (socialAccounts: Array<SocialAccount>) => {
    return socialAccounts?.map(account => 
      <div className="social-accounts">
        <div className="social-account-icon">
          {
            account.provider == "github" ? <a > <CWIcon iconName="github" iconSize="large" /> </a>
            : account.provider == "discord" ? <CWIcon iconName="discord" iconSize="large" />
            : account.provider == "telegram" ? <CWIcon iconName="telegram" iconSize="large" />
            : <div />
          }
        </div>
      </div>  
    )
}

class NewProfileHeader implements m.Component<ProfileHeaderAttrs, {}> {
  
  view(vnode) {
    const { profile, socialAccounts } = vnode.attrs;

    return(
      <div className="ProfileHeader">
        <div className="profile-image"> 
            { /* profile image */ }
        </div>

        <CWCard
          interactive={true}
          fullWidth={true}
          className="profile-content"
        > 
          <section className="profile-name">
            <CWIcon className="profile-icon" iconName="person" iconSize="small" />
            <h3> { profile?.name } </h3>
          </section>

          <section>
            <p> { profile?.bio } </p>
          </section>

          <section>
            <a> { profile?.website } </a>
          </section>

          <section>
            { 
              // renderSocialAccounts(socialAccounts)
            }
          </section>
        </CWCard>

      </div>
    )
  }
}

export default NewProfileHeader;
