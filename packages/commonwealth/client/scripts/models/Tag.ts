import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';

class Tag {
  public readonly id: number;
  public readonly name: string;
  public readonly community_count: number | undefined;
  public readonly created_at: string;

  constructor({
    id,
    name,
    community_count,
    created_at,
  }: z.infer<typeof schemas.TagView>) {
    this.id = id!;
    this.name = name;
    this.community_count = community_count;
    this.created_at = created_at?.toLocaleString() ?? '';
  }
}

export default Tag;
