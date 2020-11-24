import m from 'mithril';
import { Button } from 'construct-ui';

const ProfileBanner: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('.ProfileBanner', [
      m('.banner-text', 'This address is already in your keychain.'),
      m(Button, {
        label: 'Join community',
        onclick: (e) => {
          e.preventDefault();
        }
      })
    ]);
  }
};

export default ProfileBanner;