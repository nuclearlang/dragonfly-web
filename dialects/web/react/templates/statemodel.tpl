export enum {{class_name}}Status {
  initial = 'initial',
{{#params_list}}
  {{name}} = '{{name}}',
{{/params_list}}
}

{{decorators}}export class {{name}} {
  readonly status: {{class_name}}Status;
{{#params_list}}
{{^tinfo.is.boolean}}
  readonly {{name}}?: {{type}};
{{/tinfo.is.boolean}}
{{/params_list}}

  constructor(status: {{class_name}}Status, values: { {{#params_list}}{{^tinfo.is.boolean}}{{name}}?: {{type}}; {{/tinfo.is.boolean}}{{/params_list}}} = {}) {
    this.status = status;
{{#params_list}}
{{^tinfo.is.boolean}}
    this.{{name}} = values.{{name}};
{{/tinfo.is.boolean}}
{{/params_list}}
  }

  static initial(): {{class_name}} {
    return new {{class_name}}({{class_name}}Status.initial);
  }
{{#params_list}}

{{#tinfo.is.boolean}}
  static {{name}}(): {{class_name}} {
    return new {{class_name}}({{class_name}}Status.{{name}});
  }
{{/tinfo.is.boolean}}
{{^tinfo.is.boolean}}
  static {{name}}({{name}}: {{type}}): {{class_name}} {
    return new {{class_name}}({{class_name}}Status.{{name}}, { {{name}} });
  }
{{/tinfo.is.boolean}}
{{/params_list}}

  toString(): string {
    return `{{class_name}}.${this.status}`;
  }
{{#methods_code}}

  {{methods_code}}
{{/methods_code}}
}

export interface {{class_name}}Builders {
  initial?: () => Element;
{{#params_list}}
  {{name}}?: ({{^tinfo.is.boolean}}{{name}}: {{type}}{{/tinfo.is.boolean}}) => Element;
{{/params_list}}
  orElse?: () => Element;
}

/** One element for each state of {{class_name}} (read from the screen's provided manager); a state without a builder shows `orElse`. */
export function {{class_name}}Builder(builders: {{class_name}}Builders): Element {
  return createElement({{class_name}}BuilderView, builders);
}

function {{class_name}}BuilderView(builders: {{class_name}}Builders): Element {
  const state = useStateOf({{class_name}});
  switch (state.status) {
    case {{class_name}}Status.initial:
      return builders.initial?.() ?? builders.orElse?.() ?? null;
{{#params_list}}
    case {{class_name}}Status.{{name}}:
      return builders.{{name}}?.({{^tinfo.is.boolean}}state.{{name}}!{{/tinfo.is.boolean}}) ?? builders.orElse?.() ?? null;
{{/params_list}}
  }
}
