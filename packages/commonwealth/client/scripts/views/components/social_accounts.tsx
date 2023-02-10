import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/social_accounts.scss';

import type { NewProfile as Profile } from 'client/scripts/models';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import type { IconName } from './component_kit/cw_icons/cw_icon_lookup';

type SocialAccountAttrs = {
  iconName: IconName;
  link: string;
};

type SocialAccountsAttrs = {
  profile: Profile;
};

class SocialAccount extends ClassComponent<SocialAccountAttrs> {
  view(vnode: ResultNode<SocialAccountAttrs>) {
    const { iconName, link } = vnode.attrs;
    const formattedLink = link.includes('http') ? link : `https://${link}`;

    return (
      <a href={formattedLink} target="_blank">
        <CWIcon iconName={iconName} className="social-icon" />
      </a>
    );
  }
}

export class SocialAccounts extends ClassComponent<SocialAccountsAttrs> {
  view(vnode: ResultNode<SocialAccountsAttrs>) {
    const { profile } = vnode.attrs;

    if (!profile) return;

    const { email, socials } = profile;

    return (
      <div className="SocialAccounts">
        {email && <SocialAccount link={`mailto:${email}`} iconName="mail" />}
        {socials?.map((social, i) => {
          if (social.includes('twitter')) {
            return <SocialAccount link={social} iconName="twitter" key={i} />;
          } else if (social.includes('discord')) {
            return <SocialAccount link={social} iconName="discord" key={i} />;
          } else if (social.includes('telegram')) {
            return <SocialAccount link={social} iconName="telegram" key={i} />;
          } else if (social.includes('github')) {
            return <SocialAccount link={social} iconName="github" key={i} />;
          } else {
            return <SocialAccount link={social} iconName="website" key={i} />;
          }
        })}
      </div>
    );
  }
}
