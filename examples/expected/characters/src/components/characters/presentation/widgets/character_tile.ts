import { Character } from '../../domain/models/character';
import { CharacterDetailScreen } from '../detail/character_detail_screen';
import { Element, StatelessView, createElement, goTo, img, li, small, span, statelessOf } from 'dragonfly-web';

/** A row of the list: the character's picture, name and species; a click opens its detail. */
export function CharacterTile(props: CharacterTileProps): Element {
  return createElement(CharacterTileView, props);
}

export interface CharacterTileProps {
  key?: string | number;
  character: Character;
}

const CharacterTileView = statelessOf(
  class extends StatelessView<CharacterTileProps> {
    override build(): Element {
      return li({
        className: 'tile',
        onClick: () => goTo(CharacterDetailScreen, { id: this.props.character.id }),
        children: [
          img({ src: this.props.character.image, alt: this.props.character.name, width: 48 }),
          span({ className: 'name', children: this.props.character.name }),
          small({ children: this.props.character.species }),
        ],
      });
    }
  },
);
