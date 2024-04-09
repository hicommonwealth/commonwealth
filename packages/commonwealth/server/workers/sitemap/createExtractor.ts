interface Link {
  readonly url: string;
}

interface Page {
  readonly links: Readonly<Link>;
}

interface CreateExtractor {
  readonly hasNext: () => Promise<boolean>;
  readonly next: () => Promise<Page>;
}

export function createExtractor(type: 'mock' | 'default') {}
