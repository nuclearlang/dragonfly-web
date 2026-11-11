{{decorators}}export class {{name}} {
{{#params_list}}
{{#@first}}
  constructor({{params}}) {}

{{/@first}}
{{/params_list}}
  {{members}}
}
