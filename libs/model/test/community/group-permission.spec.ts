import { PermissionEnum } from '@hicommonwealth/schemas';
import { describe, expect, test } from 'vitest';

describe('Group Permission Enums', () => {
  test('should include VIEW_PRIVATE_TOPIC permission', () => {
    // Verify the VIEW_PRIVATE_TOPIC permission exists in the enum
    expect(PermissionEnum.VIEW_PRIVATE_TOPIC).toBeDefined();
    expect(PermissionEnum.VIEW_PRIVATE_TOPIC).toBe('VIEW_PRIVATE_TOPIC');
  });
});
