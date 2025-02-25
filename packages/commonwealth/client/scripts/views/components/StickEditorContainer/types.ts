import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';

// Extended CommentEditorProps with additional properties needed for ChipsAndModelBar
export interface ExtendedCommentEditorProps extends CommentEditorProps {
  parentCommentId?: number;
  rootThread?: {
    id: number;
    communityId: string;
    body?: string;
    title?: string;
  };
}
