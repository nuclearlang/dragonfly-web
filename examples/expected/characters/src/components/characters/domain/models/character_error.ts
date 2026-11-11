import { Json } from 'dragonfly-web';

/** Business error of the component: dragonfly builds it with the failure message. */
export class CharacterError {
  readonly message: string;

  constructor(init: { message: string }) {
    this.message = init.message;
  }

  static fromJson(json: Json): CharacterError {
    return new CharacterError({
      message: json['message'] as string,
    });
  }

  toJson(): Json {
    return {
      message: this.message,
    };
  }

  /** The same value with some fields changed. */
  copyWith(changes: Partial<{ message: string }>): CharacterError {
    return new CharacterError({ ...this, ...changes });
  }
}
