import { describe, expect, test } from 'vitest';
import { models } from '../../src/database';

describe('Topic Model', () => {
  test('should have private field', () => {
    // Create a Topic instance
    const topic = models.Topic.build({
      name: 'Test Topic',
      description: 'Test Description',
      community_id: 'test-community',
      private: true,
    });

    // Verify the fields exist and have the correct values
    expect(topic).toBeDefined();
    expect(topic.private).toBe(true);
  });
});
