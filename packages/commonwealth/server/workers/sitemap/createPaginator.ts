export interface Link {
  readonly url: string;
  readonly updated_at: string;
}

/**
 * A single page which holds a batch of links that can be converted to a sitemap.
 */
export interface Page {
  readonly links: ReadonlyArray<Link>;
}

/**
 * Interface representing a Paginator.
 *
 * A Paginator is used to navigate through a collection of pages.  This way
 * we can avoid fetching all records into memory.
 */
export interface Paginator {
  readonly hasNext: () => Promise<boolean>;
  readonly next: () => Promise<Page>;
}

export function createPaginatorDefault() {}

export function createPaginatorMock(
  nrRecords: number,
  pageSize: number,
): Paginator {
  let pageIdx = 0;
  const maxPages = Math.floor(nrRecords / pageSize);

  let idx = 0;

  async function hasNext() {
    return pageIdx <= maxPages;
  }

  async function next(): Promise<Page> {
    ++pageIdx;
    const links = [
      {
        url: 'http://www.example.com/threads/' + idx++,
        updated_at: new Date().toISOString(),
      },
    ];

    return { links };
  }

  return { hasNext, next };
}
