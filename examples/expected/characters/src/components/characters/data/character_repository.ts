import { Page } from '../../../shared/models/page';
import { Character } from '../domain/models/character';
import { CharacterError } from '../domain/models/character_error';
import { CharacterParams } from '../domain/models/character_params';
import { Cache, Decode, HttpMethod, Json, Repository, Result } from 'dragonfly-web';

/**
 * Repository: each method is an http call. The path is appended to the connection's baseUrl;
 * `:id` takes the value of the `id` parameter, and the other parameters go to the query (GET) or the body.
 */
export class CharacterRepository extends Repository {
  constructor() {
    super({ path: 'character' });
  }

  getOne(id: number): Promise<Result<CharacterError, Character>> {
    return this.result(
      () =>
        this.send(HttpMethod.get, ':id', {
          params: { id },
          decode: Decode.one(Character.fromJson),
        }),
      (e) => new CharacterError({ message: e.message }),
    );
  }

  getPage(page: number): Promise<Result<CharacterError, Page<Character>>> {
    return this.result(
      () =>
        this.send(HttpMethod.get, '', {
          params: { page },
          cache: new Cache({ ttl: 600000 }),
          cacheName: 'CharacterRepository.getPage',
          decode: Decode.one((json) => Page.fromJson(json, (o) => Character.fromJson(o as Json))),
        }),
      (e) => new CharacterError({ message: e.message }),
    );
  }

  purgeGetPage(): void {
    this.purgeCache('CharacterRepository.getPage');
  }

  /** the API answers 404 when no character has that name */
  search(name: string): Promise<Result<CharacterError, Page<Character>>> {
    return this.result(
      () =>
        this.send(HttpMethod.get, '', {
          params: { name },
          decode: Decode.one((json) => Page.fromJson(json, (o) => Character.fromJson(o as Json))),
        }),
      (e) => new CharacterError({ message: e.message }),
    );
  }

  getMany(ids: string): Promise<Character[]> {
    return this.send(HttpMethod.get, ':ids', {
      pathParams: { ids },
      decode: Decode.list(Character.fromJson),
    });
  }

  save(character: CharacterParams): Promise<Result<CharacterError, Character>> {
    return this.result(
      () =>
        this.send(HttpMethod.post, '', {
          params: { character },
          retry: 1,
          decode: Decode.one(Character.fromJson),
        }),
      (e) => new CharacterError({ message: e.message }),
    );
  }
}
