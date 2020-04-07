import m from 'mithril';
import _ from 'lodash';
import { Account } from 'models';
import MarkdownFormattedText from '../../components/markdown_formatted_text';


const ProfileBio: m.Component<{ account: Account<any> }> = {
  view: (vnode) => {
    const { account } = vnode.attrs;

    return m('.ProfileBio', [
      m('span.header', 'Bio'),
      account.profile && account.profile.bio ?
        m('p', [
          m(MarkdownFormattedText, { doc: account.profile.bio })
        ]) :
        m('.no-items', [
          (account.profile && account.profile.name) ? account.profile.name : 'This account',
          ' hasn\'t created a bio'
        ]),
    ]);
  }
};

export default ProfileBio;
