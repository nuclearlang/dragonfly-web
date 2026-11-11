import { Json } from 'dragonfly-web';

export class Origin {
  readonly name: string;
  readonly url: string;

  constructor(init: { name: string; url: string }) {
    this.name = init.name;
    this.url = init.url;
  }

  static fromJson(json: Json): Origin {
    return new Origin({
      name: json['name'] as string,
      url: json['url'] as string,
    });
  }

  toJson(): Json {
    return {
      name: this.name,
      url: this.url,
    };
  }

  /** The same value with some fields changed. */
  copyWith(changes: Partial<{ name: string; url: string }>): Origin {
    return new Origin({ ...this, ...changes });
  }
}

export class Character {
  readonly id: number;
  readonly name: string;
  readonly status: string;
  readonly species: string;
  readonly gender: string;
  readonly origin: Origin;
  readonly image: string;
  readonly episode: string[];
  readonly created: string;

  constructor(init: { id: number; name: string; status: string; species: string; gender: string; origin: Origin; image: string; episode: string[]; created: string }) {
    this.id = init.id;
    this.name = init.name;
    this.status = init.status;
    this.species = init.species;
    this.gender = init.gender;
    this.origin = init.origin;
    this.image = init.image;
    this.episode = init.episode;
    this.created = init.created;
  }

  static fromJson(json: Json): Character {
    return new Character({
      id: json['id'] as number,
      name: json['name'] as string,
      status: json['status'] as string,
      species: json['species'] as string,
      gender: json['gender'] as string,
      origin: Origin.fromJson(json['origin'] as Json),
      image: json['image'] as string,
      episode: json['episode'] as string[],
      created: json['created'] as string,
    });
  }

  toJson(): Json {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      species: this.species,
      gender: this.gender,
      origin: this.origin.toJson(),
      image: this.image,
      episode: this.episode,
      created: this.created,
    };
  }

  /** The same value with some fields changed. */
  copyWith(changes: Partial<{ id: number; name: string; status: string; species: string; gender: string; origin: Origin; image: string; episode: string[]; created: string }>): Character {
    return new Character({ ...this, ...changes });
  }
}
