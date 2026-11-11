import { CharacterRepository } from '../../data/character_repository';
import { Character } from '../models/character';
import { CharacterError } from '../models/character_error';
import { CharacterParams } from '../models/character_params';
import { Err, Guards, Ok, Result } from 'dragonfly-web';

export class SaveCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}

  async exec(character: CharacterParams): Promise<Result<CharacterError, Character>> {
    const denied = Guards.check({ session: true });
    if (denied !== null) return Err(new CharacterError({ message: denied }));
    const savedResult = await this.repository.save(character);
    if (savedResult.isErr) return Err(savedResult.error);
    const saved = savedResult.value;
    this.repository.purgeGetPage();
    return Ok(saved);
  }
}
