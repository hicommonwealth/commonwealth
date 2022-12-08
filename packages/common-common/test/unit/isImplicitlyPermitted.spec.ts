import { assert } from 'chai';
import {
  Action,
  isImplicitlyPermitted,
  removePermission,
} from 'common-common/src/permissions';

describe('isImplicitlyPermitted() unit tests', () => {

  it('should correctly isImplicitlyPermitted for Allowing createThread action', () => {
    const permission = BigInt(1) << BigInt(Action.EDIT_THREAD);
    assert.isTrue(isImplicitlyPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly isImplicitlyPermitted for Denying createThread action', () => {
    let permission = BigInt(1) << BigInt(Action.EDIT_THREAD);
    // deny edit thread permission
    permission = removePermission(permission, Action.EDIT_THREAD)
    assert.isFalse(isImplicitlyPermitted(permission, Action.CREATE_THREAD));
  });
});