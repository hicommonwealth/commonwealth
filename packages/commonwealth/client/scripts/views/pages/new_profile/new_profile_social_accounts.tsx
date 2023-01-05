/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_profile/new_profile_social_accounts.scss';

import { NewProfile as Profile } from 'client/scripts/models';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

import { IconName } from '../../components/component_kit/cw_icons/cw_icon_lookup';

type NewProfileSocialAccountsAttrs = {
  profile: Profile;
};

type NewProfileSocialAccountAttrs = {
  iconName: IconName;
  link: string;
};

class SocialAccount extends ClassComponent<NewProfileSocialAccountAttrs> {
  view(vnode: m.Vnode<NewProfileSocialAccountAttrs>) {
    const { iconName, link } = vnode.attrs;
    return (
      <a href={link} target="_blank">
        <CWIcon iconName={iconName} className="social-icon" />
      </a>
    );
  }
}

export class SocialAccounts extends ClassComponent<NewProfileSocialAccountsAttrs> {
  view(vnode: m.Vnode<NewProfileSocialAccountsAttrs>) {
    const { profile } = vnode.attrs;

    if (!profile) return;

    const { email, socials } = profile;

    return (
      <div className="SocialAccounts">
        {email && <SocialAccount link={`mailto:${email}`} iconName="mail" />}
        {socials.map((social) => {
          if (social.includes('twitter')) {
            return <SocialAccount link={social} iconName="twitter" />
          } else if (social.includes('discord')) {
            return <SocialAccount link={social} iconName="discord" />
          } else if (social.includes('telegram')) {
            return <SocialAccount link={social} iconName="telegram" />
          } else if (social.includes('github')) {
            return <SocialAccount link={social} iconName="github" />
          } else {
            return <SocialAccount link={social} iconName="website" />
          }
        })}
      </div>
    );
  }
}