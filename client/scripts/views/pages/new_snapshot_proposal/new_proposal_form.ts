import 'pages/new_proposal_page.scss';
import 'mithril-datepicker/src/style.css';
import 'mithril-timepicker/src/style.css';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Input, Form, FormLabel, FormGroup, Button, Callout } from 'construct-ui';
import DatePicker from 'mithril-datepicker';
import TimePicker from 'mithril-timepicker';

import app from 'state';

import { notifyError } from 'controllers/app/notifications';
import QuillEditor from 'views/components/quill_editor';

DatePicker.localize({
  weekStart: 1,
  locale: 'en',
  prevNextTitles: ['1M', '1A', '10A'],
  formatOptions: {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
})

interface IThreadForm {
  name?: string;
  choices: string[];
  start: string;
  end: string;
  snapshotBlockNumber: string;
}

enum NewThreadErrors {
  NoBody = 'Proposal body cannot be blank',
  NoTitle = 'Title cannot be blank',
}

const newThread = async (
  form,
  quillEditorState,
  author,
) => {
  const topics = app.chain
    ? app.chain.meta.chain.topics
    : app.community.meta.topics;

  if (!form.name) {
    throw new Error(NewThreadErrors.NoTitle);
  }

  if (quillEditorState.editor.editor.isBlank()) {
    throw new Error(NewThreadErrors.NoBody);
  }

  quillEditorState.editor.enable(false);

  const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
  if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';
  const bodyText = !quillEditorState ? ''
    : quillEditorState.markdownMode
      ? quillEditorState.editor.getText()
      : JSON.stringify(quillEditorState.editor.getContents());

  let { name } = form;
  const title = name;
  const chainId = app.activeCommunityId() ? null : app.activeChainId();
  const communityId = app.activeCommunityId();

  let result;
  // try {
  //   result = await app.threads.create(
  //     author.address,
  //     kind,
  //     stage,
  //     chainId,
  //     communityId,
  //     title,
  //     (topicName) ? topicName : 'General', // if no topic name set to default
  //     topicId,
  //     bodyText,
  //     url,
  //     attachments,
  //     readOnly,
  //   );
  // } catch (e) {
  //   console.error(e);
  //   quillEditorState.editor.enable();
  //   throw new Error(e);
  // }

  await app.user.notifications.refresh();

  m.route.set(`/${app.activeId()}/proposal/snapshot-proposal/${result.id}`);

  mixpanel.track('Create Snapshot Proposal', {
    'Step No': 2,
    Step: 'Filled in Snapshot Proposal',
  });
};

const newLink = async (form, quillEditorState, author) => {
  const errors = await newThread(form, quillEditorState, author);
  return errors;
};

export const NewProposalForm: m.Component<{}, {
  form: IThreadForm,
  quillEditorState,
  saving: boolean,
}> = {
  oninit: (vnode) => {
    vnode.state.form = {
      name: '',
      choices: ['yes', 'no'],
      start: '',
      end: '',
      snapshotBlockNumber: ''
    };
  },

  view: (vnode) => {
    if (!app.community && !app.chain) return;
    const author = app.user.activeAccount;
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;
    if (vnode.state.quillEditorState?.container) {
      vnode.state.quillEditorState.container.tabIndex = 8;
    }

    const saveToLocalStorage = () => {
      localStorage.setItem(`${app.activeId()}-new-snapshot-proposal-name`, vnode.state.form.name);
    };

    const populateFromLocalStorage = () => {
      vnode.state.form.name = localStorage.getItem(`${app.activeId()}-new-snapshot-proposal-name`);
    };

    const clearLocalStorage = () => {
      localStorage.removeItem(`${app.activeId()}-new-snapshot-proposal-name`);
    };

    return m('.NewThreadForm', {
      oncreate: (vvnode) => {
        $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      m('.new-thread-form-body', [
        m(Callout, {
          class: 'no-profile-callout',
          intent: 'primary',
          content: [
            'You need to have a minimum of 1 YFI in order to submit a proposal',
          ],
        }),
        m('.new-snapshot-proposal-form', [
          m(Form, [
            m(FormGroup, { span: { xs: 12, sm: 12 }, order: 2 }, [
              m(Input, {
                placeholder: 'Question',
                oninput: (e) => {
                  e.redraw = false; // do not redraw on input
                  const { value } = e.target as any;
                  vnode.state.form.name = value;
                  localStorage.setItem(`${app.activeId()}-new-snapshot-proposal-name`, vnode.state.form.name);
                },
                defaultValue: vnode.state.form.name,
                tabindex: 1,
              }),
            ]),
            m(FormGroup, { order: 4 }, [
              m(QuillEditor, {
                contentsDoc: '', // Prevent the editor from being filled in with previous content
                oncreateBind: (state) => {
                  vnode.state.quillEditorState = state;
                },
                placeholder: 'What is your proposal',
                editorNamespace: 'new-proposal',
                tabindex: 2,
              })
            ]),
            m(FormGroup, { order: 5 }, [
              m(Button, {
                intent: 'primary',
                label: 'Publish',
                name: 'submit',
                disabled: !author || vnode.state.saving,
                rounded: true,
                onclick: async (e) => {
                  vnode.state.saving = true;
                  try {
                    await newLink(vnode.state.form, vnode.state.quillEditorState, author);
                    vnode.state.saving = false;
                    clearLocalStorage();
                  } catch (err) {
                    vnode.state.saving = false;
                    notifyError(err.message);
                  }
                },
              }),
            ]),
          ]),
          m(Form, [
            m('h2', 'Choices'),
            m(FormGroup, [
              m(FormLabel, 'Choice 1'),
              m(Input, {
                name: 'targets',
                placeholder: 'Yes',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.choices[0] = result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Choice 2'),
              m(Input, {
                name: 'targets',
                placeholder: 'No',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.choices[1] = result;
                  m.redraw();
                },
              }),
            ]),
            m('h2', 'Start Date'),
            m(DatePicker,
              {
                locale: 'en-us',
                weekStart: 0
              }
            ),
            m(TimePicker, {
              time: {
                h: 21,
                m: 0
              },
              increment: 15
            }),
            m('h2', 'End Date'),
            m(DatePicker,
              {
                locale: 'en-us',
                weekStart: 0
              }
            ),
            m(TimePicker, {
              time: {
                h: 21,
                m: 0
              },
              increment: 15
            }),
          ]),
        ]),
      ]),
    ]);
  }
};

export default NewProposalForm;
