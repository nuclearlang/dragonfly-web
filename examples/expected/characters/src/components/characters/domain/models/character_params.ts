import { Json } from 'dragonfly-web';

/** What the API takes to create a character. */
export class CharacterParams {
  readonly name: string;
  readonly status: string;
  readonly species: string;

  constructor(init: { name: string; status: string; species: string }) {
    this.name = init.name;
    this.status = init.status;
    this.species = init.species;
  }

  static fromJson(json: Json): CharacterParams {
    return new CharacterParams({
      name: json['name'] as string,
      status: json['status'] as string,
      species: json['species'] as string,
    });
  }

  toJson(): Json {
    return {
      name: this.name,
      status: this.status,
      species: this.species,
    };
  }

  /** The same value with some fields changed. */
  copyWith(changes: Partial<{ name: string; status: string; species: string }>): CharacterParams {
    return new CharacterParams({ ...this, ...changes });
  }
}
