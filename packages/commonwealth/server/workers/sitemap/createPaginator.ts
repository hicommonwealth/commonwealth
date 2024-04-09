export interface Link {
  readonly url: string;
  readonly updated_at: string;
}

export interface Page {
  readonly links: ReadonlyArray<Link>;
}

interface Paginator {
  readonly hasNext: () => Promise<boolean>;
  readonly next: () => Promise<Page>;
}

export function createPaginator(type: 'mock' | 'default') {
  switch (type) {
    case 'mock':
      return createPaginatorMock();
  }
}

export function createPaginatorMock(): Paginator {
  let idx = 0;
  const maxPages = 1;

  async function hasNext() {
    return idx < maxPages;
  }
  async function next(): Promise<Page> {
    const links = [
      {
        url: 'http://www.example.com/threads/1',
        updated_at: new Date().toISOString(),
      },
    ];

    return { links };
  }

  return { hasNext, next };
}
