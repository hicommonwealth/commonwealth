import { assert } from 'chai';
import {
  Action,
  getImplicitActionsSet,
  removePermission,
} from 'common-common/src/permissions';

describe('getImplicitActions() unit tests', () => {
  it('should correctly isImplicitlyPermitted for Allowing createThread action', () => {
    const actions = getImplicitActionsSet(Action.CREATE_THREAD, true);
    assert.isTrue(actions.includes(Action.CREATE_THREAD));
    assert.isTrue(actions.includes(Action.CREATE_COMMENT));
    assert.isTrue(actions.includes(Action.VIEW_THREADS));
    assert.isTrue(actions.includes(Action.CREATE_REACTION));
    assert.isTrue(actions.includes(Action.VIEW_REACTIONS));
    assert.isTrue(actions.includes(Action.VIEW_COMMENTS));
  });

  it('should correctly isImplicitlyPermitted for Allowing createComment action', () => {
    const actions = getImplicitActionsSet(Action.CREATE_COMMENT, true);
    assert.isTrue(actions.includes(Action.CREATE_COMMENT));
    assert.isTrue(actions.includes(Action.VIEW_COMMENTS));
    assert.isTrue(actions.includes(Action.VIEW_REACTIONS));
    assert.isTrue(actions.includes(Action.CREATE_REACTION));
  });

  it('should correctly isImplicitlyPermitted for Allowing CREATE_POLL action', () => {
    const actions = getImplicitActionsSet(Action.CREATE_POLL, true);
    assert.isTrue(actions.includes(Action.VOTE_ON_POLLS));
    assert.isTrue(actions.includes(Action.VIEW_POLLS));
  });

  it('should correctly isImplicitlyPermitted for Allowing View Chat Channels action', () => {
    const actions = getImplicitActionsSet(Action.VIEW_CHAT_CHANNELS, true);
    assert.isTrue(actions.includes(Action.VIEW_CHAT_CHANNELS));
  });

  it('should correctly isImplicitlyPermitted for Denying ViewReactions action', () => {
    const actions = getImplicitActionsSet(Action.VIEW_REACTIONS, false);
    assert.isTrue(actions.includes(Action.VIEW_REACTIONS));
    assert.isTrue(actions.includes(Action.CREATE_REACTION));
    assert.isTrue(actions.includes(Action.VIEW_COMMENTS));
    assert.isTrue(actions.includes(Action.VIEW_THREADS));
  });

  it('should correctly isImplicitlyPermitted for Denying Create Threads action', () => {
    const actions = getImplicitActionsSet(Action.CREATE_THREAD, false);
    assert.isTrue(actions.includes(Action.CREATE_THREAD));
    assert.isTrue(actions.includes(Action.EDIT_THREAD));
    assert.isTrue(actions.includes(Action.DELETE_THREAD));
    assert.isFalse(actions.includes(Action.CREATE_COMMENT));
    assert.isFalse(actions.includes(Action.EDIT_COMMENT));
    assert.isFalse(actions.includes(Action.DELETE_COMMENT));
    assert.isFalse(actions.includes(Action.VIEW_COMMENTS));
    assert.isFalse(actions.includes(Action.CREATE_POLL));
    assert.isFalse(actions.includes(Action.VOTE_ON_POLLS));
    assert.isFalse(actions.includes(Action.VIEW_POLLS));
    assert.isFalse(actions.includes(Action.VIEW_THREADS));
    assert.isFalse(actions.includes(Action.CREATE_REACTION));
    assert.isFalse(actions.includes(Action.VIEW_REACTIONS));
  });
});
