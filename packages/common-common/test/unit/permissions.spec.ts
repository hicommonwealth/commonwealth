import { assert } from 'chai';
import {
  addPermission,
  removePermission,
  Action,
  isPermitted,
} from '../../src/permissions';
const base_permission = BigInt(0);

describe('addPermission() unit tests', () => {
  it('should correctly add permission to a role', () => {
    let base = base_permission;
    base = addPermission(base, Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(base, Action.CREATE_THREAD));
  });

  it('should correctly add multiple permissions to a role', () => {
    let base = base_permission;
    base = addPermission(base, Action.CREATE_THREAD);
    base = addPermission(base, Action.VIEW_CHAT_CHANNELS);

    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(base, Action.CREATE_THREAD));
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(base, Action.VIEW_CHAT_CHANNELS));
  });
});

describe('removePermission() unit tests', () => {
  it('should correctly add and remove permission to a role', () => {
    let base = base_permission;
    base = addPermission(base, Action.CREATE_THREAD);
    base = removePermission(base, Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(base, Action.CREATE_THREAD));
  });

  it('should correctly add multiple permissions to a role and remove one', () => {
    let base = base_permission;
    base = addPermission(base, Action.CREATE_THREAD);
    base = addPermission(base, Action.VIEW_CHAT_CHANNELS);
    base = removePermission(base, Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(base, Action.CREATE_THREAD));
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(base, Action.VIEW_CHAT_CHANNELS));
  });
});
