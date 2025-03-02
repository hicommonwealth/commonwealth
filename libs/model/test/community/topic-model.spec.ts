import { describe, expect, test } from 'vitest';
import { models } from '../../src/database';

describe('Topic Model', () => {
  test('should have private and group_ids fields', () => {
    // Create a Topic instance
    const topic = models.Topic.build({
      name: 'Test Topic',
      description: 'Test Description',
      community_id: 'test-community',
      private: true,
      group_ids: [1, 2, 3],
    });

    // Verify the fields exist and have the correct values
    expect(topic).toBeDefined();
    expect(topic.private).toBe(true);
    expect(topic.group_ids).toEqual([1, 2, 3]);
  });
});
