{{decorators}}export class {{name}} extends Repository {
  constructor() {
    super({{#decor.repository.args}}{ {{decor.repository.args}} }{{/decor.repository.args}});
  }

  {{members}}
}
