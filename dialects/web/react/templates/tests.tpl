{{decorators}}describe('{{name}}', () => {
  beforeEach(async () => {
    await DragonflyTest.start(dragonflyConfig(), registerDragonfly);
{{#decor.mock.items}}
    DragonflyTest.mock({{.}});
{{/decor.mock.items}}
  });

  {{members}}
});
