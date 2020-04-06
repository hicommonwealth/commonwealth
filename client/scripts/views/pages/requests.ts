// import 'pages/requests.scss';

// import { default as $ } from 'jquery';
// import { default as _ } from 'lodash';
// import { default as m, VnodeDOM } from 'mithril';
// import { default as mixpanel } from 'mixpanel-browser';

// import app from 'state';

// import ObjectPage from 'views/pages/_object_page';
// import ProposalsLoadingRow from 'views/components/proposals_loading_row';
// import ResizableTextarea from 'views/components/widgets/resizable_textarea';
// import { OffchainThreadKind, AnyProposal } from 'models';
// import { idToProposal, ProposalType } from 'identifiers';
// import ProposalComments from '../components/proposal_comments';
// import ReactionButton, { ReactionType } from '../components/reaction_button';
// import { CommenterPreview } from './questions';

// const NewRequestForm: m.Component<{}, { form, error }> = {
//   view: (vnode: VnodeDOM<{}, { form, error }>) => {
//     const activeEntity = app.community ? app.community : app.chain;
//     if (!activeEntity) return;
//     if (!app.vm.activeAccount) return;
//     if (!vnode.state.form) vnode.state.form = {};

//     const newRequest = () => {
//       if (!vnode.state.form.request) {
//         return vnode.state.error = 'A request is required.';
//       }

//       app.threads.create(
//         app.vm.activeAccount.address,
//         OffchainThreadKind.Request,
//         vnode.state.form.request
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

//     return m('.NewRequestForm', [
//       m(ResizableTextarea, {
//         name: 'request',
//         placeholder: 'Request a feature...',
//         oninput: (e) => { vnode.state.form.request = e.target.value; }
//       }),
//       m('button.formular-primary-button', {
//         type: 'submit',
//         onclick: newRequest
//       }, 'Request'),
//       m('.clear'),
//     ]);
//   }
// };

// const RequestsItem: m.Component<{ item }, { open }> = {
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
//     return m('.RequestsItem', {
//       class: open ? 'open' : 'closed',
//     }, [
//       m('.item', [
//         m('.item-left', [
//           m('.item-title', item.title),
//           m('.item-commenters',  {
//             onclick: (e) => {
//               e.preventDefault();
//               vnode.state.open = !vnode.state.open;
//               m.redraw();
//             },
//           }, [
//             m(CommenterPreview, { proposal }),
//             m('span.item-carat', {
//               class: open ? 'icon-up-open' : 'icon-down-open'
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

// const RequestsListing: m.Component<{}, { count: number }> = {
//   view: (vnode: VnodeDOM<{}, { count: number }>) => {
//     const activeEntity = app.community ? app.community : app.chain;
//     if (!activeEntity) return;

//     if (!vnode.state.count) vnode.state.count = 10;
//     //TODO: Write controller to fetch ten at a time to save on load time
//     const allProposals = app?.threads.getType(OffchainThreadKind.Request);
//     const visibleProposals = allProposals.sort((a, b) => b.createdAt - a.createdAt).slice(0, vnode.state.count);
//     const numHidden = allProposals.length - visibleProposals.length;
//     return m('.RequestsListing', [
//       m('h4', 'Recent Requests'),
//       !activeEntity || !activeEntity.serverLoaded ? m(ProposalsLoadingRow) :
//         visibleProposals.length === 0 && numHidden > 0 ? m('.no-threads', 'No recent threads') :
//         visibleProposals.length === 0 ? m('.no-threads', 'No threads') :
//         visibleProposals.map((item) => m(RequestsItem, { item })),
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

// const RequestsPage: m.Component<{}, { max: boolean }> = {
//   oncreate: (vnode) => {
//     mixpanel.track('PageVisit', {'Page Name': 'ProjectsPage'});
//   },
//   view: (vnode) => {
//     return m(ObjectPage, {
//       class: 'RequestsPage',
//       content: m('.forum-container', [
//         m('h4', 'Feature Requests'),
//         m(NewRequestForm),
//         m(RequestsListing),
//       ]),
//     });
//   }
// };

// export default RequestsPage;
