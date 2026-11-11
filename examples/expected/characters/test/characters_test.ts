import { CharactersComponent } from '../src/components/characters/characters_component';
import { CharacterRepository } from '../src/components/characters/data/character_repository';
import { Character, Origin } from '../src/components/characters/domain/models/character';
import { CharacterError } from '../src/components/characters/domain/models/character_error';
import { GetPageUseCase } from '../src/components/characters/domain/usecases/get_page_usecase';
import { CharacterListScreen } from '../src/components/characters/presentation/list/character_list_screen';
import { CharactersManager } from '../src/components/characters/presentation/list/managers/characters_manager';
import { CharactersState } from '../src/components/characters/presentation/list/state_models/characters_state';
import { dragonflyConfig, registerDragonfly } from '../src/dragonfly.g';
import { Page, PageInfo } from '../src/shared/models/page';
import { screen } from '@testing-library/react';
import { Err, Ok, inject } from 'dragonfly-web';
import { DragonflyTest, errOf, okOf, renderScreen, statesOf, when } from 'dragonfly-web/testing';
import { beforeEach, describe, expect, test } from 'vitest';

/** Tests of the characters component: the repository is a mock; everything else is the real code. */
export function character(name: string, status: string): Character {
  return new Character({
    id: 1,
    name: name,
    status: status,
    species: 'Human',
    gender: 'Male',
    origin: new Origin({ name: 'Earth', url: '' }),
    image: '',
    episode: [],
    created: '',
  });
}

export function page(): Page<Character> {
  return new Page({
    info: new PageInfo({ count: 2, pages: 1 }),
    results: [character('Rick', 'Alive'), character('Birdperson', 'Dead')],
  });
}

describe('CharactersTest', () => {
  beforeEach(async () => {
    await DragonflyTest.start(dragonflyConfig(), registerDragonfly);
    DragonflyTest.mock(CharacterRepository);
  });

  beforeEach(async () => {
    when(inject(CharacterRepository).getPage).thenReturn(Ok(page()));
  });

  test('GetPageUseCase keeps only the alive characters', async () => {
    const result = await inject(GetPageUseCase).exec(1);
    expect(okOf(result)).toEqual([character('Rick', 'Alive')]);
  });

  test('a failed request is an error of the component', async () => {
    when(inject(CharacterRepository).getPage).thenReturn(Err(new CharacterError({ message: 'down' })));
    expect(errOf(await inject(CharactersComponent).getPage(2))).toEqual(new CharacterError({ message: 'down' }));
  });

  test('the manager loads the alive characters', async () => {
    const manager = inject(CharactersManager);
    const states = await statesOf(manager, async () => {
      await manager.loadPage(1);
    });
    expect(states).toEqual([CharactersState.loading(), CharactersState.full([character('Rick', 'Alive')])]);
  });

  test('the list shows the alive characters', async () => {
    renderScreen(CharacterListScreen());
    await screen.findByText('Rick');
    expect(screen.queryByText('Birdperson')).toBeNull();
  });
});
