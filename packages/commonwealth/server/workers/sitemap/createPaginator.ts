import { models, ThreadInstance } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

export interface Link {
  readonly id: number;
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

export function createPaginatorDefault(limit: number = 50000): Paginator {
  // the page we're on...
  let idx = 0;

  let ptr = -1;

  let records: ReadonlyArray<Link> = [];

  async function hasNext() {
    return idx === 0 || records.length !== 0;
  }

  type ThreadPartial = Pick<ThreadInstance, 'id' | 'updated_at'>;

  async function next(): Promise<Page> {
    ++idx;

    const raw = await models.sequelize.query(
      `
          SELECT "Threads".id, "Threads".updated_at
          FROM "Threads"
          WHERE "Threads".id > ${ptr}
          ORDER BY "Threads".id 
          LIMIT ${limit};
      `,
      { type: QueryTypes.SELECT },
    );

    records = raw.map((current) => {
      const currentThread = current as ThreadPartial;
      const url = `http://www.example.com/${currentThread.id}`;
      return {
        id: currentThread.id,
        url,
        updated_at: currentThread.updated_at.toISOString(),
      };
    });

    if (records.length > 0) {
      ptr = records[records.length - 1].id;
    }

    return {
      links: records,
    };
  }

  return { hasNext, next };
}

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
        id: 0,
        url: 'http://www.example.com/threads/' + idx++,
        updated_at: new Date().toISOString(),
      },
    ];

    return { links };
  }

  return { hasNext, next };
}
