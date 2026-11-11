import { CharacterTile } from '../widgets/character_tile';
import { CharactersManager } from './managers/characters_manager';
import { CharactersStateBuilder } from './state_models/characters_state';
import { Element, Providers, StatelessView, button, createElement, h1, main, p, statelessOf, ul } from 'dragonfly-web';

/** The list of characters: its state comes from CharactersManager, provided to this screen. */
/** @screen: builds CharactersManager once for this screen and provides them to its views. */
export function CharacterListScreen(props: CharacterListScreenProps = {}): Element {
  return createElement(Providers, {
    managers: [CharactersManager],
    children: createElement(CharacterListScreenView, props),
  });
}

export interface CharacterListScreenProps {
  key?: string | number;
}

const CharacterListScreenView = statelessOf(
  class extends StatelessView<CharacterListScreenProps> {
    override build(): Element {
      return main({
        className: 'characters',
        children: [
          h1({ children: 'Characters' }),
          CharactersStateBuilder({
            loading: () => p({ children: 'Loading...' }),
            full: (characters) => ul({ children: characters.map((c) => CharacterTile({ key: c.id, character: c })) }),
            error: (e) => p({ className: 'error', children: e.message }),
          }),
          button({
            onClick: () => this.manager(CharactersManager).loadPage(2),
            children: 'Next page',
          }),
        ],
      });
    }
  },
);
