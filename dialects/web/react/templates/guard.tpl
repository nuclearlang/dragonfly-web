{{decorators}}export class {{name}} extends Guard {
{{#params_list}}
{{#@first}}
  constructor({{params}}) {
    super();
  }

{{/@first}}
{{/params_list}}
  {{members}}
}
