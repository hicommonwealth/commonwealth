// comments
import useFetchCommentsQuery from './fetchComments';
import useEditCommentMutation from './editComment';
import useCreateCommentMutation from './createComment';
import useDeleteCommentMutation from './deleteComment';
import useToggleCommentSpamStatusMutation from "./toggleCommentSpamStatus";
// comment reactions
import useFetchCommentReactionsQuery from './fetchReactions';
import useCreateCommentReactionMutation from './createReaction';
import useDeleteCommentReactionMutation from './deleteReaction';

export {
    // comments
    useFetchCommentsQuery,
    useEditCommentMutation,
    useCreateCommentMutation,
    useDeleteCommentMutation,
    useToggleCommentSpamStatusMutation,
    // comment reactions
    useFetchCommentReactionsQuery,
    useCreateCommentReactionMutation,
    useDeleteCommentReactionMutation,
};

