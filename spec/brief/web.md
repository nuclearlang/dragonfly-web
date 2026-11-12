# Platform `web` brief: Dragonfly web apps

A Dragonfly web app has only `.nuc` files and `public/`; the app is generated in `build/app` (never edit it).
You write the business logic; the framework writes the rest (components, DI, routing, JSON, states, http). The
platform's words are the mobile platform's (`repository`, `usecase`, `appcomponent`, `statemanager`, `@screen`); the
views are HTML functions. Full rules: `nuclear help web`; where each file goes: `nuclear help layout --platform web`.

## Work cycle

1. `dragonfly new <name> -p web` makes the project; put each file in its folder (the folder gives the kind).
2. Write following this sheet. A kind or decorator: `nuclear help <word> --platform web`; never guess one.
3. `dragonfly check` (or `nuclear check . --json`) until no errors, then `dragonfly test`.

## Layout and kinds (the folder gives the kind of a declaration without a header word)

```
main.nuc (the App view: the router)  config.nuc  config/ (appConfig)  public/ (styles.css, favicon.svg)
shared/ models/ events/ components/ guards/ screens/
components/<c>/<c>_component.nuc        appcomponent: the facade, the only thing other components see
components/<c>/data/                    repository
components/<c>/domain/models/           model (no word)
components/<c>/domain/usecases/         usecase          components/<c>/domain/services/   service
components/<c>/presentation/<screen>/   <screen>_screen.nuc, managers/, state_models/ (no word), widgets/
test/                                   tests (no word)
```

Calls allowed (N0301/N0302): screen → statemanager → appcomponent → usecase → repository/service.

## Pieces

```nuclear
// repository (data/): each method is an http call; :id goes to the path, other params to the query/body
@repository(path = "character")
repository CharacterRepository
  @get(path = ":id")
  getOne(id: int) Result<CharacterError, Character>

  @get(cache = true, ttl = 600000)
  getPage(page: int) Result<CharacterError, Character[]>

  @post(retry = 1)
  save(character: Character) Result<CharacterError, Character>

// usecase (domain/usecases/): one method exec that returns Result; dependencies in the constructor line
usecase GetPageUseCase
  (repository: CharacterRepository)

  exec(page: int) Result<CharacterError, Character[]>
    ~repository.getPage(page)

// appcomponent (<c>_component.nuc): aliases to the use cases, never constructor parameters
appcomponent CharactersComponent
  getPage() = GetPageUseCase.exec

// state model (state_models/): each field is a state of the screen; a boolean is a state without data
CharactersState
  (full: Character[], error: CharacterError, loading: boolean)

// statemanager (managers/): @state(M.x) emits that state with the method's value; an Err emits `error`
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

// a view: its parameters are its props; build() Element; HTML functions with named attributes and `children`
stateless CharacterTile(character: Character)
  build() Element
    li(
      className = "tile",
      onClick = () => goTo(CharacterListScreen),
      children = [span(className = "name", children = character.name), small(children = character.species)],
    )

// a screen: @screen(route, providers, loggedIn, acl, notFound); <State>Builder has one callback per state
@screen(route = "/", providers = [CharactersManager])
stateless CharacterListScreen
  build() Element
    main(
      children = [
        CharactersStateBuilder(
          loading = () => p(children = "Loading..."),
          full = (list) => ul(children = list.map((c) => CharacterTile(key = c.id, character = c))),
          error = (e) => p(className = "error", children = e.message),
        ),
        button(onClick = () => CharactersManager.loadPage(2), children = "Next page"),
      ],
    )
```

- Attributes are the DOM's names: `className`, `onClick`, `onChange = (e) => ...`, `src`, `alt`; `children` is a
  text, an element or a list. A list of views passes `key`. No JSX, no `class =`, no positional text.
- A view never omits `build() Element`; a `stateful` has fields, `initState()` and `setState(() => ...)`.
- Navigation by screen, never by address: `goTo(Screen, id = 7)`, `goBack()`. Inside a screen,
  `Manager.method()` calls its provider; elsewhere `inject<CharactersComponent>()`.
- A statemanager has no generics (`statemanager M<S>` is N0218): the state model goes in `@stateModel(S)`.
- Events: `event Name` + fields; `Events.publish(Name(...))`; `useEvent(Name)` in `build`. Access: `guard` with
  `canActivate()`, `@screen(acl = {...})`, `@acl(...)` on a use case. Not in this version: forms, translations,
  the local database, plugins.
- Tests (`test/`, no word): `@mock([Repo])`, `when(Repo.method).thenReturn(Ok(x))`, `@test`, `@states("...",
  expect = [...])`, `@widget` with `renderScreen(Screen())` and `~screen.findByText("...")`.
