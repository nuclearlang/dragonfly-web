import { Character } from '../../../domain/models/character';
import { CharacterError } from '../../../domain/models/character_error';
import { Element, createElement, useStateOf } from 'dragonfly-web';

/** State model: each field is a state of the screen. */
export enum CharactersStateStatus {
  initial = 'initial',
  full = 'full',
  error = 'error',
  loading = 'loading',
}

export class CharactersState {
  readonly status: CharactersStateStatus;
  readonly full?: Character[];
  readonly error?: CharacterError;

  constructor(status: CharactersStateStatus, values: { full?: Character[]; error?: CharacterError; } = {}) {
    this.status = status;
    this.full = values.full;
    this.error = values.error;
  }

  static initial(): CharactersState {
    return new CharactersState(CharactersStateStatus.initial);
  }

  static full(full: Character[]): CharactersState {
    return new CharactersState(CharactersStateStatus.full, { full });
  }

  static error(error: CharacterError): CharactersState {
    return new CharactersState(CharactersStateStatus.error, { error });
  }

  static loading(): CharactersState {
    return new CharactersState(CharactersStateStatus.loading);
  }

  toString(): string {
    return `CharactersState.${this.status}`;
  }
}

export interface CharactersStateBuilders {
  initial?: () => Element;
  full?: (full: Character[]) => Element;
  error?: (error: CharacterError) => Element;
  loading?: () => Element;
  orElse?: () => Element;
}

/** One element for each state of CharactersState (read from the screen's provided manager); a state without a builder shows `orElse`. */
export function CharactersStateBuilder(builders: CharactersStateBuilders): Element {
  return createElement(CharactersStateBuilderView, builders);
}

function CharactersStateBuilderView(builders: CharactersStateBuilders): Element {
  const state = useStateOf(CharactersState);
  switch (state.status) {
    case CharactersStateStatus.initial:
      return builders.initial?.() ?? builders.orElse?.() ?? null;
    case CharactersStateStatus.full:
      return builders.full?.(state.full!) ?? builders.orElse?.() ?? null;
    case CharactersStateStatus.error:
      return builders.error?.(state.error!) ?? builders.orElse?.() ?? null;
    case CharactersStateStatus.loading:
      return builders.loading?.() ?? builders.orElse?.() ?? null;
  }
}
