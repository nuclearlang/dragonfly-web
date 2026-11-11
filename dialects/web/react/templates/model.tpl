{{decorators}}export class {{name}}{{generics}} {
{{#fields}}
  readonly {{name}}{{#optional}}?{{/optional}}: {{type}}{{#optional}} | null{{/optional}};
{{/fields}}

  constructor(init: { {{#fields}}{{name}}{{#optional}}?{{/optional}}{{^optional}}{{#default}}?{{/default}}{{/optional}}: {{type}}{{#optional}} | null{{/optional}}{{^@last}}; {{/@last}}{{/fields}} }{{^fields_required}} = {}{{/fields_required}}) {
{{#fields}}
    this.{{name}} = init.{{name}}{{#default}} ?? {{default}}{{/default}};
{{/fields}}
  }

  static fromJson{{generics}}(json: Json{{#generic_list}}, fromJson{{name}}: (json: unknown) => {{name}}{{/generic_list}}): {{name}}{{generics}} {
    return new {{name}}{{generics}}({
{{#fields}}
      {{name}}: {{#tinfo.generic}}{{#tinfo.list}}(json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}] as unknown[]).map(fromJson{{tinfo.item}}){{/tinfo.list}}{{^tinfo.list}}fromJson{{tinfo.item}}(json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}]){{/tinfo.list}}{{/tinfo.generic}}{{^tinfo.generic}}{{#tinfo.model}}{{#tinfo.list}}(json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}] as Json[]{{#optional}} | null{{/optional}}){{#optional}}?{{/optional}}.map((o) => {{tinfo.item}}.fromJson(o)){{/tinfo.list}}{{^tinfo.list}}{{#optional}}json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}] == null ? null : {{/optional}}{{tinfo.item}}.fromJson(json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}] as Json){{/tinfo.list}}{{/tinfo.model}}{{^tinfo.model}}{{#tinfo.is.DateTime}}{{#optional}}json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}] == null ? null : {{/optional}}new Date(json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}] as string){{/tinfo.is.DateTime}}{{^tinfo.is.DateTime}}json[{{#decor.key}}{{decor.key.arg}}{{/decor.key}}{{^decor.key}}'{{name}}'{{/decor.key}}] as {{type}}{{#optional}} | null{{/optional}}{{/tinfo.is.DateTime}}{{/tinfo.model}}{{/tinfo.generic}},
{{/fields}}
    });
  }

  toJson({{#generic_list}}{{#@first}}{{/@first}}toJson{{name}}: (value: {{name}}) => unknown{{^@last}}, {{/@last}}{{/generic_list}}): Json {
    return {
{{#fields}}
      {{#decor.key}}[{{decor.key.arg}}]{{/decor.key}}{{^decor.key}}{{name}}{{/decor.key}}: {{#tinfo.generic}}{{#tinfo.list}}this.{{name}}.map(toJson{{tinfo.item}}){{/tinfo.list}}{{^tinfo.list}}toJson{{tinfo.item}}(this.{{name}}){{/tinfo.list}}{{/tinfo.generic}}{{^tinfo.generic}}{{#tinfo.model}}{{#tinfo.list}}this.{{name}}{{#optional}}?{{/optional}}.map((o) => o.toJson()){{/tinfo.list}}{{^tinfo.list}}this.{{name}}{{#optional}}?{{/optional}}.toJson(){{/tinfo.list}}{{/tinfo.model}}{{^tinfo.model}}{{#tinfo.is.DateTime}}this.{{name}}{{#optional}}?{{/optional}}.toISOString(){{/tinfo.is.DateTime}}{{^tinfo.is.DateTime}}this.{{name}}{{/tinfo.is.DateTime}}{{/tinfo.model}}{{/tinfo.generic}},
{{/fields}}
    };
  }

  /** The same value with some fields changed. */
  copyWith(changes: Partial<{ {{#fields}}{{name}}: {{type}}{{#optional}} | null{{/optional}}{{^@last}}; {{/@last}}{{/fields}} }>): {{name}}{{generics}} {
    return new {{name}}{{generics}}({ ...this, ...changes });
  }
{{#methods_code}}

  {{methods_code}}
{{/methods_code}}
}
