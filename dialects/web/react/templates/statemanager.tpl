{{decorators}}export class {{name}} extends StateManager<{{decor.stateModel.arg}}> {
{{#ctor}}
  {{ctor}}
{{/ctor}}
{{^ctor}}
  constructor() {
    super({{decor.stateModel.arg}}.initial());
  }
{{/ctor}}

  {{members}}
}
