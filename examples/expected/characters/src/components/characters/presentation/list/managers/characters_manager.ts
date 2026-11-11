import { CharactersComponent } from '../../../characters_component';
import { Character } from '../../../domain/models/character';
import { CharacterError } from '../../../domain/models/character_error';
import { CharactersState } from '../state_models/characters_state';
import { Result, StateManager } from 'dragonfly-web';

export class CharactersManager extends StateManager<CharactersState> {
  constructor(private readonly characters: CharactersComponent) {
    super(CharactersState.initial());
    this.loadPage(1);
  }

  loading(): void {
    this.emit(CharactersState.loading());
  }

  async loadPage(page: number): Promise<void> {
    this.loading();
    const result = await this._loadPage(page);
    this.emit(result.match(CharactersState.error, CharactersState.full));
  }

  private async _loadPage(page: number): Promise<Result<CharacterError, Character[]>> {
    return await this.characters.getPage(page);
  }
}
