import { assert } from 'chai';
import {
  addAllowPermission,
  removeAllowPermission,
  Action,
  isPermitted,
} from '../../src/permissions';
const base_permission = BigInt(0);

describe('addAllowPermission() unit tests', () => {

  it('should correctly add permission to a role', () => {
    let base = base_permission;
    base = addAllowPermission(base, Action.CREATE_THREAD);

    assert.isTrue(isPermitted(base, Action.CREATE_THREAD));
  });

  it('should correctly add multiple permissions to a role', () => {
    let base = base_permission;
    base = addAllowPermission(base, Action.CREATE_THREAD);
    base = addAllowPermission(base, Action.VIEW_CHAT_CHANNELS);

    assert.isTrue(isPermitted(base, Action.CREATE_THREAD));
    assert.isTrue(isPermitted(base, Action.VIEW_CHAT_CHANNELS));
    assert.isTrue(isPermitted(base, Action.VIEW_COMMENTS));
  });
});

describe('removePermission() unit tests', () => {

  it('should correctly add and remove permission to a role', () => {
    let base = base_permission;
    base = addAllowPermission(base, Action.CREATE_THREAD);
    base = removeAllowPermission(base, Action.CREATE_THREAD);

    assert.isFalse(isPermitted(base, Action.CREATE_THREAD));
  });

  it('should correctly add multiple permissions to a role and remove one', () => {
    let base = base_permission;
    base = addAllowPermission(base, Action.CREATE_THREAD);
    base = addAllowPermission(base, Action.VIEW_CHAT_CHANNELS);
    base = removeAllowPermission(base, Action.CREATE_THREAD);

    assert.isFalse(isPermitted(base, Action.CREATE_THREAD));
    assert.isTrue(isPermitted(base, Action.VIEW_CHAT_CHANNELS));
  });
});
