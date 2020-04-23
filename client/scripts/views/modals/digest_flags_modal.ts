import 'components/digest_flag.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';

import app from 'state';

import { CompactModalExitButton } from 'views/modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';


interface IDigestSelectButtonState {
  selected: boolean;
}

interface IDigestSelectButtonAttrs {
  offchain_thread_id: number;
  selected: boolean;
  onChangeHandler?: any;
}

interface IDigestVoteState {
  voted: boolean;
}

interface IDigestVoteAttrs {
  offchain_thread_id: number;
  votes: number;
  onChangeHandler?: any;
}

interface IDigestFlagRowState {
  digestFlag;
}

interface IDigestFlagRowAttrs {
  digestFlag;
}

interface IDigestFlagsModalState {
  digestFlags;
}

interface IDigestFlagsModalAttrs {
}

const DigestSelectButton: m.Component<IDigestSelectButtonAttrs, IDigestSelectButtonState> = {
  oninit: (vnode) => {
    vnode.state.selected = vnode.attrs.selected;
  },
  view: (vnode) => {
    const text = (vnode.state.selected) ? 'Selected!' : 'Not Selected';
    return m('td', [
      m('button', {
        class: (vnode.state.selected) ? 'selected' : '',
        onclick: (e) => {
          console.dir(vnode.state.selected);
          const select = vnode.state.selected;
          $.post(`${app.serverUrl()}/addDigestFlag`, {
            id: vnode.attrs.offchain_thread_id,
            selected: !select,
            jwt: app.login.jwt,
          }).then((result) => {
            console.dir(result.result.selected);
            vnode.state.selected = result.result.selected;
            vnode.attrs.onChangeHandler(result.result);
            m.redraw();
          });
        },
      }, `${text}`),
    ]);
  }
};

const DigestVoteButton: m.Component<IDigestVoteAttrs, IDigestVoteState> = {
  oninit: (vnode) => {
    vnode.state.voted = false;
  },
  view: (vnode) => {
    return m('td', [
      m('button', {
        class: (vnode.state.voted) ? 'voted' : '',
        onclick: (e) => {
          if (vnode.state.voted) { return; }
          e.preventDefault();
          $.post(`${app.serverUrl()}/addDigestFlag`, {
            id: vnode.attrs.offchain_thread_id,
            jwt: app.login.jwt,
          }).then((result) => {
            vnode.state.voted = true;
            vnode.attrs.votes = result.result.votes;
            console.dir(result.result);
            vnode.attrs.onChangeHandler(result.result);
            m.redraw();
          });
        }
      }, vnode.state.voted ? 'Voted!' : 'Vote'),
    ]);
  },
};


const DigestFlagRow: m.Component<IDigestFlagRowAttrs, IDigestFlagRowState> = {
  oninit: (vnode) => {
    vnode.state.digestFlag = vnode.attrs.digestFlag;
  },
  view: (vnode) => {
    const { offchain_thread_id, admin_id, votes, selected, offchain_thread_title } = vnode.state.digestFlag;

    return m('tr.DigestFlagRow', [
      m('td.title', `${offchain_thread_title}`), // TODO: Needs cleaning. Datatype.TEXT x STRING issue.
      m('td.votes', `${votes}`),
      m('td.id', `${offchain_thread_id}`),
      m('td.admin', `${admin_id}`),
      m(DigestVoteButton, {
        offchain_thread_id,
        votes,
        onChangeHandler: (result) => { vnode.state.digestFlag = result; },
      }),
      m(DigestSelectButton, {
        offchain_thread_id,
        selected,
        onChangeHandler: (result) => { vnode.state.digestFlag = result; },
      }),
    ]);
  }
};


const DigestFlagsModal: m.Component<IDigestFlagsModalAttrs, IDigestFlagsModalState> = {
  oninit: (vnode) => {
    vnode.state.digestFlags = [];
  },
  oncreate: (vnode) => {
    mixpanel.track('Email Digest Flags', {
      'Step No': 1,
      'Step': 'Modal Opened'
    });
    $.get(`${app.serverUrl()}/getDigestFlags`, {
      jwt: app.login.jwt,
    }).then((result) => {
      result.result.map((flag) => vnode.state.digestFlags.push(flag));
      console.dir(vnode.state.digestFlags);
      m.redraw();
    });
  },
  view: (vnode) => {
    return m('.DigestFlagsModal', [
      m(CompactModalExitButton),
      m('table.flags', [
        m('tr.titleRow', [
          m('td.title', 'Title'),
          m('td.votes', 'Votes'),
          m('td.id', 'Id'),
          m('td.admin', 'Admin id'),
          m('td', 'Vote'),
          m('td', 'Selection'),
        ]),
        vnode.state.digestFlags.map((digestFlag) => {
          return m(DigestFlagRow, { digestFlag });
        }),
      ]),
      m('button.sendEmail', {
        onclick: (e) => {
          $.get(`${app.serverUrl()}/sendDigestEmail`, {
            jwt: app.login.jwt,
          }).then((result) => {
            notifySuccess('Email Sent Successfully');
            console.dir(result.result);
          }, (err) => {
            notifyError('Emails not sent without error');
          });
        }
      }, 'Send Email'),
    ]);
  }
};

export default DigestFlagsModal;
