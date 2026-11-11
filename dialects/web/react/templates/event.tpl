{{decorators}}export class {{name}} extends AppEvent {
{{#fields}}
  readonly {{name}}{{#optional}}?{{/optional}}: {{type}}{{#optional}} | null{{/optional}};
{{/fields}}

  constructor(init: { {{#fields}}{{name}}{{#optional}}?{{/optional}}{{^optional}}{{#default}}?{{/default}}{{/optional}}: {{type}}{{#optional}} | null{{/optional}}{{^@last}}; {{/@last}}{{/fields}} }{{^fields_required}} = {}{{/fields_required}}) {
    super();
{{#fields}}
    this.{{name}} = init.{{name}}{{#default}} ?? {{default}}{{/default}};
{{/fields}}
  }

  static fromJson(json: Json): {{name}} {
    return new {{name}}({
{{#fields}}
      {{name}}: json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}] as {{type}}{{#optional}} | null{{/optional}},
{{/fields}}
    });
  }

  get eventName(): string {
    return '{{name}}';
  }

  toJson(): Json {
    return {
{{#fields}}
      {{#decor.key}}[{{decor.key.arg}}]{{/decor.key}}{{^decor.key}}{{name}}{{/decor.key}}: this.{{name}},
{{/fields}}
    };
  }
{{#methods_code}}

  {{methods_code}}
{{/methods_code}}
}
