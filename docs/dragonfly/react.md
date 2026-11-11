# Dragonfly for React: a web app in Nuclear

The web platform is the mobile platform in a browser (ADR-0097): the same kinds and words, so an app's domain,
state and tests read the same on a phone and on the web. The `react` dialect writes React 19 (no JSX), React
Router 7, Vite and Vitest for you. Rules: [web.md](../../spec/web.md) (the platform), [react.md](../../spec/react.md)
(the dialect).

## 1. A project

```
characters/
├── config.nuc
├── main.nuc
├── config/project_config.nuc
├── components/characters/
│   ├── characters_component.nuc
│   ├── data/character_repository.nuc
│   ├── domain/models/character.nuc
│   ├── domain/usecases/get_page_usecase.nuc
│   └── presentation/list/
│       ├── character_list_screen.nuc
│       ├── managers/characters_manager.nuc
│       └── state_models/characters_state.nuc
└── test/characters_test.nuc
```

```nuclear
// config.nuc
dragonfly(platform = "web", dialect = "react")
app(name = "characters", description = "The characters of an API.", version = "1.0.0")

// config/project_config.nuc
appConfig ProjectConfig
  connections: Connection[] = [Http(baseUrl = "https://rickandmortyapi.com/api/")]

// main.nuc: the App view is the router with every @screen
stateless App
  build() Element
    createElement(RouterProvider, router = appRouter())
```

Create, build and run it with the `dragonfly` CLI (it writes `config.nuc`, `main.nuc` and
`config/project_config.nuc` as above):

```sh
dragonfly new characters -p web -d react
cd characters
dragonfly check            # nuclear check .
dragonfly build            # writes build/app (src/, test/, index.html, package.json, vite.config.ts)
dragonfly install          # npm install in build/app (with the dragonfly-web runtime)
dragonfly run              # npm run dev → http://localhost:5173
dragonfly test             # vitest (jsdom)
```

Without the CLI, `nuclear build .` writes the same `build/app`; then `npm install`, `npm run dev` and `npm test`
there.

### In VS Code: the web device

A web project's toolbar has ▷ Serve, ▭ Device, ◉ Debug, ↻ Reload, Build, Test and Check. **▭ Device** opens the app
beside the code in a headless browser the editor drives, like the mobile device:

- the size of a desktop, a laptop, a tablet or a phone (with its user agent and touch), rotated or any size
  (*Responsive*), at any zoom and always sharp;
- an address bar (back, forward, reload, an address of the app), the page in your browser, Chrome's DevTools of it;
- the color scheme (`prefers-color-scheme`), network throttling (fast 4G, slow 3G, offline), no cache;
- the page's **Console** (a line's source opens the generated file) and **Network** (method, status, address, type,
  size, time), with a filter;
- a screenshot (`build/screenshots/`).

Saving a `.nuc` rebuilds and Vite updates the page. **◉ Debug** attaches VS Code's JavaScript debugger to the device's
page: a breakpoint in a `.nuc` stops there, the paused line is shown in the `.nuc` (`build/app/.nuclear/lines.json`,
written by every build). F5 with `build/<name>.code-workspace` debugs the app in Chrome instead.

## 2. Data and domain, the mobile words

```nuclear
// domain/models/character.nuc
Character
  id: int
  name: string
  status: string
  image: string

// data/character_repository.nuc
@repository(path = "character")
repository CharacterRepository
  @get(path = ":id")
  getOne(id: int) Result<CharacterError, Character>

  @get(cache = true, ttl = 600000)
  getPage(page: int) Result<CharacterError, Page<Character>>

// domain/usecases/get_page_usecase.nuc
usecase GetPageUseCase
  (repository: CharacterRepository)

  @requires(internet = true)
  exec(page: int) Result<CharacterError, Character[]>
    data = ~repository.getPage(page)
    Ok(data.results.filter((c) => c.status == "Alive"))

// characters_component.nuc
appcomponent CharactersComponent
  getPage() = GetPageUseCase.exec
```

The model gets `fromJson`, `toJson` and `copyWith`; the repository method is a `fetch` with cache and retries; the
use case is a class the injector builds.

## 3. State and screens

```nuclear
// presentation/list/state_models/characters_state.nuc
CharactersState
  (full: Character[], error: CharacterError, loading: boolean)

// presentation/list/managers/characters_manager.nuc
@stateModel(CharactersState)
statemanager CharactersManager
  (characters: CharactersComponent)
    loadPage(1)

  @state(CharactersState.loading)
  loading()

  @before(loading)
  @state(CharactersState.full)
  loadPage(page: int) Result<CharacterError, Character[]>
    ~characters.getPage(page)

// presentation/list/character_list_screen.nuc
@screen(route = "/", providers = [CharactersManager])
stateless CharacterListScreen
  build() Element
    main(children = [
      h1(children = "Characters"),
      CharactersStateBuilder(
        loading = () => p(children = "Loading..."),
        full = (characters) => ul(children = characters.map((c) => CharacterTile(key = c.id, character = c))),
        error = (e) => p(className = "error", children = e.message),
      ),
      button(onClick = () => CharactersManager.loadPage(2), children = "Next page"),
    ])

// presentation/widgets/character_tile.nuc
stateless CharacterTile(character: Character)
  build() Element
    li(onClick = () => goTo(CharacterDetailScreen, id = character.id), children = [
      img(src = character.image, alt = character.name),
      span(children = character.name),
    ])
```

Elements are HTML functions (`div`, `ul`, `li`, `button`, `input`, `img`...) with the attributes as named arguments
and `children`; a view is called like a function. `@screen(providers = [...])` creates the managers for the screen;
`CharactersManager.loadPage(2)` inside its views uses the provided one; `CharactersStateBuilder` re-renders on
every state. `goTo(Screen, id = 7)` navigates by screen, never by address.

A `stateful` keeps its fields while it is shown:

```nuclear
@screen(route = "/characters/:id")
stateful CharacterDetailScreen(id: int)
  character?: Character

  initState() void
    load()

  load() void
    result: Result<CharacterError, Character> = ~inject<CharactersComponent>().getOne(id)
    match result
      Ok(c) -> setState(() => character = c)
      Err(e) -> Log.e(e.message)

  build() Element
    section(children = [
      button(onClick = () => goBack(), children = "Back"),
      character != null ? h2(children = character!.name) : p(children = "Loading..."),
    ])
```

## 4. Tests

```nuclear
@mock([CharacterRepository])
CharactersTest
  beforeEach()
    when(CharacterRepository.getPage).thenReturn(Ok(page()))

  @test("GetPageUseCase keeps only the alive characters")
  aliveOnly()
    result = ~GetPageUseCase.exec(1)
    expect(okOf(result)).toEqual([character("Rick", "Alive")])

  @states("the manager loads the alive characters", expect = [CharactersState.loading(), CharactersState.full([character("Rick", "Alive")])])
  loadsPage(manager: CharactersManager)
    ~manager.loadPage(1)

  @widget("the list shows the alive characters")
  showsList()
    renderScreen(CharacterListScreen())
    ~screen.findByText("Rick")
```

The app starts with its real config; every request answers what the test prepares (`DragonflyTest.respondWith`), or
a mock answers (`@mock`, `when`, `verify`); a screen renders in a memory router and Testing Library reads it.

## 5. What is not there yet, and the React ecosystem

This first version has the mobile kinds a browser needs; forms, converters, translations, the local database and
the AI kinds come next with the same words. ADR-0097 analyses zustand (as the engine of `StateManager`), TanStack
Query (background refetch for a repository method) and react-hook-form + zod (for `form`): the platform's words
stay, the dialect may use those libraries underneath.

The complete example: `examples/examples-web/characters` (built, type-checked and tested by
`tools/react-check/check.sh`). A real site written with it: the NuclearLang website (its screens, managers, search
and content repository are Nuclear; a build script turns the repositories' docs into the JSON it reads).
