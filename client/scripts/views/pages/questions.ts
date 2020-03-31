// import 'pages/questions.scss';

// import { default as $ } from 'jquery';
// import { default as _ } from 'lodash';
// import { default as m, VnodeDOM } from 'mithril';
// import { default as mixpanel } from 'mixpanel-browser';

// import app from 'state';

// import ObjectPage from 'views/pages/_object_page';
// import ProposalsLoadingRow from 'views/components/proposals_loading_row';
// import ResizableTextarea from 'views/components/widgets/resizable_textarea';
// import { OffchainThreadKind, AnyProposal } from '../../models/models';
// import ProposalComments from '../components/proposal_comments';
// import { idToProposal, ProposalType } from 'identifiers';
// import ReactionButton, { ReactionType } from '../components/reaction_button';

// const NewQuestionForm: m.Component<{}, { form, error }> = {
//   view: (vnode: VnodeDOM<{}, {form, error}>) => {
//     const activeEntity = app.community ? app.community : app.chain;
//     if (!activeEntity) return;
//     if (!app.vm.activeAccount) return;
//     if (!vnode.state.form) vnode.state.form = {};

//     const newQuestion = () => {
//       if (!vnode.state.form.question) {
//         return vnode.state.error = 'A question is required.';
//       }

//       app.threads.create(
//         app.vm.activeAccount.address,
//         OffchainThreadKind.Question,
//         vnode.state.form.question
//       ).then((res) => {
//         vnode.state.form = {};
//         $(vnode.dom).find('.ResizableTextarea').val('');
//         m.redraw();
//       }).catch((err : any) => {
//         vnode.state.error = err.message;
//         m.redraw();
//       });
//       return;
//     };

//     return m('.NewQuestionForm', [
//       m(ResizableTextarea, {
//         name: 'question',
//         placeholder: 'Ask a question...',
//         oninput: (e) => { vnode.state.form.question = e.target.value; }
//       }),
//       m('button.formular-primary-button', {
//         type: 'submit',
//         onclick: newQuestion
//       }, 'Ask'),
//       m('.clear'),
//     ]);
//   }
// };

// export const CommenterPreview: m.Component<{ proposal: AnyProposal }> = {
//   view: (vnode) => {
//     const proposal = vnode.attrs.proposal;
//     const activeEntity = app.community ? app.community : app.chain;
//     const comments = app.comments.getByProposal(proposal);
//     let copy : string;

//     const names : string[] = [];
//     const avatars = [];
//     for (const comment of comments) {
//       const { chain, author } = comment;
//       const commenter = app.profiles.getProfile(chain, author);
//       if (!names.includes(commenter.name)) {
//         names.push(commenter.name);
//         avatars.push(commenter.getAvatar(16));
//       }
//     }

//     if (comments.length === 0) {
//       copy = 'No answers yet to this question.';
//     } else if (names.length > 3) {
//       const remainingUsers = names.length - 3;
//       const other = (remainingUsers === 1) ? 'other' : 'others';
//       copy = (names.slice(0, 3).join(', ') + ' and ' + remainingUsers + ` ${other} answered.`);
//     } else {
//       copy = (names.join(', ') + ' answered.');
//     }

//     return m('.CommenterPreview', [
//       !!avatars.length && m('.user-avatars', [
//         avatars.map((avi) => m('.user-avatar', avi))
//       ]),
//       m('a.item-commenters-text', { href: '#' }, copy)
//     ]);
//   }
// };

// const QuestionsItem: m.Component<{ item }, { open: boolean }> = {
//   view: (vnode) => {
//     const { item } = vnode.attrs;
//     const proposalId = item.id;
//     const { open } = vnode.state;
//     let proposal : AnyProposal;
//     try {
//       proposal = idToProposal(ProposalType.OffchainThread, proposalId);
//     } catch (e) {
//       return m(PageNotFound);
//     }
//     return m('.QuestionsItem', {
//       class: open ? 'open' : 'closed',
//     }, [
//       m('.item', [
//         m('.item-left', [
//           m('.item-title', item.title),
//           m('.item-commenters', {
//             onclick: (e) => {
//               e.preventDefault();
//               vnode.state.open = !vnode.state.open;
//               m.redraw();
//             },
//           }, [
//             m(CommenterPreview, { proposal }),
//             m('span.item-carat', {
//               class: open ? 'icon-up-open' : 'icon-down-open',
//             })
//           ]),
//         ]),
//         m('.item-right', [
//           m('.reaction-button-wrapper', [
//             m(ReactionButton, { proposal, type: ReactionType.Like }),
//             m(ReactionButton, { proposal, type: ReactionType.Dislike })
//           ])
//         ]),
//       ]),
//       vnode.state.open && m(ProposalComments, { proposal }),
//     ]);
//   }
// };

// const QuestionsListing: m.Component<{}, { count: number }> = {
//   view: (vnode: VnodeDOM<{}, { count: number }>) => {
//     const activeEntity = app.community ? app.community : app.chain;
//     if (!activeEntity) return;

//     if (!vnode.state.count) vnode.state.count = 10;
//     //TODO: Write controller to fetch ten at a time to save on load time
//     const allProposals = app?.server.threads.getType(OffchainThreadKind.Question);
//     const visibleProposals = allProposals.sort((a, b) => b.createdAt - a.createdAt).slice(0, vnode.state.count);
//     const numHidden = allProposals.length - visibleProposals.length;

//     return m('.QuestionsListing', [
//       m('h4', 'Recent Questions'),
//       !activeEntity || !activeEntity.serverLoaded ? m(ProposalsLoadingRow) :
//         visibleProposals.length === 0 && numHidden > 0 ? m('.no-threads', 'No recent threads') :
//         visibleProposals.length === 0 ? m('.no-threads', 'No threads') :
//         visibleProposals.map((item) => m(QuestionsItem, { item })),
//       activeEntity && numHidden > 0 && m('a.extra-items', {
//         href: '#',
//         onclick: (e) => {
//           e.preventDefault();
//           vnode.state.count += 10;
//         }
//       }, `${numHidden} more...`),
//     ]);
//   }
// };

// const QuestionsPage: m.Component = {
//   oncreate: (vnode: VnodeDOM) => {
//     mixpanel.track('PageVisit', {'Page Name': 'ProjectsPage'});
//   },
//   view: (vnode: VnodeDOM) => {
//     return m(ObjectPage, {
//       class: 'QuestionsPage',
//       content: m('.forum-container', [
//         m('h4', 'Q&A'),
//         m(NewQuestionForm),
//         m(QuestionsListing),
//       ]),
//     });
//   }
// };

// export default QuestionsPage;
