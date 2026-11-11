import { Character } from './domain/models/character';
import { CharacterError } from './domain/models/character_error';
import { CharacterParams } from './domain/models/character_params';
import { GetOneCharacterUseCase } from './domain/usecases/get_one_character_usecase';
import { GetPageUseCase } from './domain/usecases/get_page_usecase';
import { SaveCharacterUseCase } from './domain/usecases/save_character_usecase';
import { SearchCharactersUseCase } from './domain/usecases/search_characters_usecase';
import { Result, inject } from 'dragonfly-web';

/**
 * Application component: the facade of the component. Other components and the screens use
 * characters only through these functions.
 */
export class CharactersComponent {
  async getOne(id: number): Promise<Result<CharacterError, Character>> {
    return await inject(GetOneCharacterUseCase).exec(id);
  }

  async getPage(page: number): Promise<Result<CharacterError, Character[]>> {
    return await inject(GetPageUseCase).exec(page);
  }

  async save(character: CharacterParams): Promise<Result<CharacterError, Character>> {
    return await inject(SaveCharacterUseCase).exec(character);
  }

  async search(name: string): Promise<Result<CharacterError, Character[]>> {
    return await inject(SearchCharactersUseCase).exec(name);
  }
}
