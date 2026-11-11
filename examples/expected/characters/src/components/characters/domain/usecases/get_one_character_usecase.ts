import { CharacterRepository } from '../../data/character_repository';
import { Character } from '../models/character';
import { CharacterError } from '../models/character_error';
import { Result } from 'dragonfly-web';

export class GetOneCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}

  async exec(id: number): Promise<Result<CharacterError, Character>> {
    return await this.repository.getOne(id);
  }
}
