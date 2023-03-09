/* @jsx m */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/social_accounts.scss';

import type { NewProfile as Profile } from 'client/scripts/models';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import type { IconName } from './component_kit/cw_icons/cw_icon_lookup';

type SocialAccountsAttrs = {
  profile: Profile;
};

type SocialAccountAttrs = {
  iconName: IconName;
  link: string;
};

class SocialAccount extends ClassComponent<SocialAccountAttrs> {
  view(vnode: m.Vnode<SocialAccountAttrs>) {
    const { iconName, link } = vnode.attrs;
    const formattedLink =
      link.includes('http') ? link : `https://${link}`;

    return (
      <a href={formattedLink} target="_blank">
        <CWIcon iconName={iconName} className="social-icon" />
      </a>
    );
  }
}

export class SocialAccounts extends ClassComponent<SocialAccountsAttrs> {
  view(vnode: m.Vnode<SocialAccountsAttrs>) {
    const { profile } = vnode.attrs;

    if (!profile) return;

    const { socials } = profile;

    return (
      <div className="SocialAccounts">
        {/* {email && <SocialAccount email={true} link={`mailto:${email}`} iconName="mail" />} */}
        {socials?.map((social) => {
          if (social.includes('twitter')) {
            return <SocialAccount link={social} iconName="twitter" />;
          } else if (social.includes('discord')) {
            return <SocialAccount link={social} iconName="discord" />;
          } else if (social.includes('telegram')) {
            return <SocialAccount link={social} iconName="telegram" />;
          } else if (social.includes('github')) {
            return <SocialAccount link={social} iconName="github" />;
          } else {
            return <SocialAccount link={social} iconName="website" />;
          }
        })}
      </div>
    );
  }
}
