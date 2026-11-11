import { Character } from '../models/character';

/** A domain service: rules the use cases share. */
export class CharacterNames {
  alive(characters: Character[]): Character[] {
    return characters.filter((c) => c.status === 'Alive');
  }
}
