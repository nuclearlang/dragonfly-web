import { Json } from 'dragonfly-web';

/** A page of an API list: always info + results; only the model of each result changes. */
export class PageInfo {
  readonly count: number;
  readonly pages: number;
  readonly next?: string | null;
  readonly prev?: string | null;

  constructor(init: { count: number; pages: number; next?: string | null; prev?: string | null }) {
    this.count = init.count;
    this.pages = init.pages;
    this.next = init.next;
    this.prev = init.prev;
  }

  static fromJson(json: Json): PageInfo {
    return new PageInfo({
      count: json['count'] as number,
      pages: json['pages'] as number,
      next: json['next'] as string | null,
      prev: json['prev'] as string | null,
    });
  }

  toJson(): Json {
    return {
      count: this.count,
      pages: this.pages,
      next: this.next,
      prev: this.prev,
    };
  }

  /** The same value with some fields changed. */
  copyWith(changes: Partial<{ count: number; pages: number; next: string | null; prev: string | null }>): PageInfo {
    return new PageInfo({ ...this, ...changes });
  }
}

export class Page<T> {
  readonly info: PageInfo;
  readonly results: T[];

  constructor(init: { info: PageInfo; results: T[] }) {
    this.info = init.info;
    this.results = init.results;
  }

  static fromJson<T>(json: Json, fromJsonT: (json: unknown) => T): Page<T> {
    return new Page<T>({
      info: PageInfo.fromJson(json['info'] as Json),
      results: (json['results'] as unknown[]).map(fromJsonT),
    });
  }

  toJson(toJsonT: (value: T) => unknown): Json {
    return {
      info: this.info.toJson(),
      results: this.results.map(toJsonT),
    };
  }

  /** The same value with some fields changed. */
  copyWith(changes: Partial<{ info: PageInfo; results: T[] }>): Page<T> {
    return new Page<T>({ ...this, ...changes });
  }
}
