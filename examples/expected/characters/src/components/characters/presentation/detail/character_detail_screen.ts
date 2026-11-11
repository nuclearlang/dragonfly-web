import { CharactersComponent } from '../../characters_component';
import { Character } from '../../domain/models/character';
import { CharacterError } from '../../domain/models/character_error';
import { Element, Result, StatefulView, StatelessView, article, button, createElement, goBack, h2, img, inject, p, section, small, statefulOf, statelessOf } from 'dragonfly-web';

/** One character, loaded when the screen is shown (a stateful keeps what it loaded between renders). */
export function CharacterDetailScreen(props: CharacterDetailScreenProps): Element {
  return createElement(CharacterDetailScreenView, props);
}

export interface CharacterDetailScreenProps {
  key?: string | number;
  id: number;
}

const CharacterDetailScreenView = statefulOf(
  class extends StatefulView<CharacterDetailScreenProps> {
    character: Character | null = null;
    error: string | null = null;

    override initState(): void {
      this.load();
    }

    async load(): Promise<void> {
      const result: Result<CharacterError, Character> = await inject(CharactersComponent).getOne(this.props.id);
      if (result.isOk) {
        this.show(result.value, null);
      } else {
        this.show(null, result.error.message);
      }
    }

    show(loaded: Character | null, failure: string | null): void {
      this.setState(() => {
        this.character = loaded;
        this.error = failure;
      });
    }

    override build(): Element {
      return section({
        className: 'detail',
        children: [
          button({ onClick: () => goBack(), children: 'Back' }),
          ...(this.error != null ? [p({ className: 'error', children: this.error })] : []),
          this.character != null ? CharacterCard({ character: this.character! }) : p({ children: 'Loading...' }),
        ],
      });
    }
  },
);

export function CharacterCard(props: CharacterCardProps): Element {
  return createElement(CharacterCardView, props);
}

export interface CharacterCardProps {
  key?: string | number;
  character: Character;
}

const CharacterCardView = statelessOf(
  class extends StatelessView<CharacterCardProps> {
    override build(): Element {
      return article({
        children: [
          img({ src: this.props.character.image, alt: this.props.character.name }),
          h2({ children: this.props.character.name }),
          p({ children: `${this.props.character.status} · ${this.props.character.species} · ${this.props.character.gender}` }),
          small({ children: `From ${this.props.character.origin.name}` }),
        ],
      });
    }
  },
);
