import { CharacterRepository } from '../../data/character_repository';
import { Character } from '../models/character';
import { CharacterError } from '../models/character_error';
import { CharacterNames } from '../services/character_names';
import { Err, Guards, Log, Ok, Result } from 'dragonfly-web';

export class GetPageUseCase {
  constructor(
    private readonly repository: CharacterRepository,
    private readonly names: CharacterNames,
  ) {}

  async exec(page: number): Promise<Result<CharacterError, Character[]>> {
    const denied = Guards.check({ internet: true });
    if (denied !== null) return Err(new CharacterError({ message: denied }));
    const dataResult = await this.repository.getPage(page);
    if (dataResult.isErr) return Err(dataResult.error);
    const data = dataResult.value;
    Log.d(
      'page loaded',
      {
        data: { 'page': page, 'count': data.results.length },
        at: 'characters › usecase › GetPageUseCase.exec · components/characters/domain/usecases/get_page_usecase.nuc:7',
      },
    );
    return Ok(this.names.alive(data.results));
  }
}
