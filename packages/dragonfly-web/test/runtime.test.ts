import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import {
  AppConfig,
  Cache,
  Decode,
  Err,
  Events,
  AppEvent,
  Http,
  HttpError,
  HttpMethod,
  inject,
  Ok,
  Providers,
  register,
  Repository,
  Result,
  StateManager,
  StatelessView,
  StatefulView,
  statelessOf,
  statefulOf,
  useStateOf,
  button,
  div,
  h1,
  createElement,
  Element,
} from '../src/index.js';
import { DragonflyTest, renderScreen, statesOf, when, verify } from '../src/testing.js';

class Note {
  readonly id: number;
  readonly title: string;

  constructor(init: { id: number; title: string }) {
    this.id = init.id;
    this.title = init.title;
  }

  static fromJson(json: Record<string, unknown>): Note {
    return new Note({ id: json['id'] as number, title: json['title'] as string });
  }
}

class NoteError {
  constructor(readonly message: string) {}
}

class NotesConfig extends AppConfig {
  override readonly connections = [new Http({ baseUrl: 'https://api.test/' })];
}

/** `@repository(path = "notes")` as the transpiler writes it. */
class NoteRepository extends Repository {
  constructor() {
    super({ path: 'notes' });
  }

  one(id: number): Promise<Result<NoteError, Note>> {
    return this.attempt(
      () => this.send(HttpMethod.get, ':id', { params: { id }, decode: Decode.one(Note.fromJson) }),
      Ok,
      (e) => Err(new NoteError(e.message)),
    );
  }

  byTag(tag: string): Promise<Note[]> {
    return this.send(HttpMethod.get, '', {
      params: { tag },
      cache: new Cache({ ttl: 60_000 }),
      cacheName: 'NoteRepository.byTag',
      decode: Decode.list(Note.fromJson),
    });
  }

  create(title: string): Promise<Note> {
    return this.send(HttpMethod.post, '', { params: { title }, decode: Decode.one(Note.fromJson) });
  }
}

class NotesState {
  constructor(
    readonly status: 'initial' | 'loaded' | 'error',
    readonly notes?: Note[],
    readonly error?: NoteError,
  ) {}

  static initial(): NotesState {
    return new NotesState('initial');
  }

  static loaded(notes: Note[]): NotesState {
    return new NotesState('loaded', notes);
  }

  static error(error: NoteError): NotesState {
    return new NotesState('error', undefined, error);
  }
}

class NotesManager extends StateManager<NotesState> {
  constructor(readonly notes: NoteRepository) {
    super(NotesState.initial());
  }

  async load(tag: string): Promise<void> {
    this.emit(NotesState.loaded(await this.notes.byTag(tag)));
  }
}

class Pinged extends AppEvent {
  constructor(readonly n: number) {
    super();
  }

  get eventName(): string {
    return 'Pinged';
  }

  toJson(): Record<string, unknown> {
    return { n: this.n };
  }
}

async function start(): Promise<void> {
  await DragonflyTest.start(new NotesConfig(), () => {
    register(NoteRepository, () => new NoteRepository());
    register(NotesManager, () => new NotesManager(inject(NoteRepository)), { singleton: false });
  });
}

describe('Repository', () => {
  test('a GET takes the path parameter, the rest goes to the query; a POST sends the body', async () => {
    await start();
    DragonflyTest.respond((r) => (r.path === '/notes/7' ? [200, { id: 7, title: 'seven' }] : [200, [{ id: 1, title: 'a' }]]));
    const repo = inject(NoteRepository);
    expect((await repo.one(7)).value.title).toBe('seven');
    expect((await repo.byTag('work')).map((n) => n.id)).toEqual([1]);
    expect(DragonflyTest.requests[1].url).toBe('https://api.test/notes?tag=work');
    await repo.create('new');
    expect(DragonflyTest.requests[2]).toMatchObject({ method: 'POST', body: { title: 'new' } });
  });

  test('a failed request is a Result error, or a thrown HttpError', async () => {
    await start();
    DragonflyTest.respondWith({ message: 'gone' }, 404);
    const repo = inject(NoteRepository);
    expect((await repo.one(1)).error.message).toBe('gone');
    await expect(repo.create('x')).rejects.toBeInstanceOf(HttpError);
  });

  test('a cached GET does not ask twice; purgeCache forgets it', async () => {
    await start();
    DragonflyTest.respondWith([{ id: 1, title: 'a' }]);
    const repo = inject(NoteRepository);
    await repo.byTag('t');
    await repo.byTag('t');
    expect(DragonflyTest.requests.length).toBe(1);
    repo.purgeCache('NoteRepository.byTag');
    await repo.byTag('t');
    expect(DragonflyTest.requests.length).toBe(2);
  });

  test('a mock answers what when() prepares', async () => {
    await start();
    const mock = DragonflyTest.mock(NoteRepository);
    when(mock.one).thenReturn(Ok(new Note({ id: 9, title: 'mocked' })));
    expect((await inject(NoteRepository).one(9)).value.title).toBe('mocked');
    verify(mock.one).called(1);
  });
});

describe('StateManager and views', () => {
  test('statesOf records every emitted state', async () => {
    await start();
    DragonflyTest.respondWith([{ id: 1, title: 'a' }]);
    const manager = inject(NotesManager);
    const states = await statesOf(manager, () => manager.load('x'));
    expect(states.map((s) => s.status)).toEqual(['loaded']);
    expect(states[0].notes?.[0].title).toBe('a');
  });

  test('a stateless view with a provided manager shows the state; a stateful keeps its fields', async () => {
    await start();
    DragonflyTest.respondWith([{ id: 1, title: 'first note' }]);

    class NotesScreenView extends StatelessView<Record<string, never>> {
      build(): Element {
        const state = useStateOf(NotesState);
        return div({ children: [h1('Notes'), ...(state.notes ?? []).map((n) => div({ key: n.id, children: n.title }))] });
      }
    }
    const NotesScreen = (): Element =>
      createElement(Providers, { managers: [NotesManager], children: createElement(statelessOf(NotesScreenView), {}) });

    class CounterView extends StatefulView<{ start: number }> {
      count = 0;

      override initState(): void {
        this.count = this.props.start;
      }

      build(): Element {
        return button({ onClick: () => this.setState(() => this.count++), children: `count ${this.count}` });
      }
    }
    const Counter = statefulOf(CounterView);

    const r = renderScreen(div({ children: [createElement(NotesScreen), createElement(Counter, { start: 5 })] }));
    expect(screen.getByText('Notes')).toBeTruthy();
    const b = screen.getByRole('button');
    expect(b.textContent).toBe('count 0');
    const { act } = await import('@testing-library/react');
    await act(async () => {
      b.click();
    });
    expect(b.textContent).toBe('count 6');
    r.unmount();
  });

  test('events reach every subscriber', () => {
    const seen: number[] = [];
    const stop = Events.subscribe(Pinged, (e) => seen.push(e.n));
    Events.publish(new Pinged(1));
    stop();
    Events.publish(new Pinged(2));
    expect(seen).toEqual([1]);
  });
});
