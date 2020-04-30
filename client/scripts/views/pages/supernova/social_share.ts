import 'pages/supernova/social_share.scss';

import { default as m } from 'mithril';

const SocialShare: m.Component = {
  view: (vnode) => {
    return m('.SocialShare', [
      m('p.congratulations', 'Congratulations! You can share your participation here:'),
      m('a.share-tweet', {
        target: '_blank',
        href: 'https://twitter.com/share?url=commonwealth.im/supernova'
          + '&text=I%20just%20participated%20in%20the%20Supernova%20lockdrop!&via=hicommonwealth'
      },
      'Share on Twitter')
    ]);
  }
};

export default SocialShare;
