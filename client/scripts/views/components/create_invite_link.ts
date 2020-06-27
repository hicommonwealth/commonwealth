import $ from 'jquery';
import m from 'mithril';
import app from 'state';

const CreateInviteLink: m.Component<{onChangeHandler?: Function}, {link}> = {
  oninit: (vnode) => {
    vnode.state.link = '';
  },
  view: (vnode: m.VnodeDOM<{onChangeHandler?: Function}, {link}>) => {
    return m('.CreateInviteLink', [
      m('h4', 'Option 3: Create invite link'),
      m('form.invite-link-parameters', [
        m('label', { for: 'uses', }, 'Number of uses:'),
        m('select', { name: 'uses' }, [
          m('option', { value: 'none', }, 'Unlimited'),
          m('option', { value: 1, }, 'Once'),
          // m('option', { value: 2, }, 'Twice'),
        ]),
        m('label', { for: 'time', }, 'Expires after:'),
        m('select', { name: 'time' }, [
          m('option', { value: 'none', }, 'None'),
          m('option', { value: '24h', }, '24 hours'),
          m('option', { value: '48h', }, '48 hours'),
          m('option', { value: '1w', }, '1 week'),
          m('option', { value: '30d', }, '30 days'),
        ]),
        m('button.submit.formular-button-primary', {
          onclick: (e) => {
            e.preventDefault();
            const time = $(vnode.dom).find('[name="time"] option:selected').val();
            const uses = $(vnode.dom).find('[name="uses"] option:selected').val();
            // TODO: Change to POST /inviteLink
            $.post(`${app.serverUrl()}/createInviteLink`, {
              community_id: app.activeCommunityId(),
              time,
              uses,
              jwt: app.user.jwt,
            }).then((response) => {
              const linkInfo = response.result;
              const url = (app.isProduction) ? 'commonwealth.im' : 'localhost:8080';
              if (vnode.attrs.onChangeHandler) vnode.attrs.onChangeHandler(linkInfo);
              vnode.state.link = `${url}${app.serverUrl()}/acceptInviteLink?id=${linkInfo.id}`;
              m.redraw();
            });
          }
        }, 'Get invite link'),
        m('input.invite-link-pastebin', {
          disabled: true,
          value: `${vnode.state.link}`,
        }),
      ]),
    ]);
  }
};

export default CreateInviteLink;
