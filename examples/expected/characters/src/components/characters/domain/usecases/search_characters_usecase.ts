import { CharacterRepository } from '../../data/character_repository';
import { Character } from '../models/character';
import { CharacterError } from '../models/character_error';
import { Err, Ok, Result } from 'dragonfly-web';

export class SearchCharactersUseCase {
  constructor(private readonly repository: CharacterRepository) {}

  async exec(name: string): Promise<Result<CharacterError, Character[]>> {
    const pageResult = await this.repository.search(name);
    if (pageResult.isErr) return Err(pageResult.error);
    const page = pageResult.value;
    return Ok(page.results);
  }
}
