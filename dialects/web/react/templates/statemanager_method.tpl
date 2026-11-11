{{#decor.state}}
async {{name}}({{params}}): Promise<void> {
{{#decor.before}}
  {{decor.before.arg}}();
{{/decor.before}}
{{#ret_info.result}}
  const result = {{#async}}await {{/async}}this._{{name}}({{call_args}});
  this.emit(result.match({{owner_decor.stateModel.arg}}.error, {{decor.state.arg}}));
{{/ret_info.result}}
{{^ret_info.result}}
  this.emit({{decor.state.arg}}({{#async}}await {{/async}}this._{{name}}({{call_args}})));
{{/ret_info.result}}
{{#decor.after}}
  {{decor.after.arg}}();
{{/decor.after}}
}

private {{#async}}async {{/async}}_{{name}}({{params}}){{#ret}}: {{ret}}{{/ret}} {
  {{body}}
}
{{/decor.state}}
{{^decor.state}}
{{#override}}override {{/override}}{{#async}}async {{/async}}{{name}}({{params}}){{#ret}}: {{ret}}{{/ret}} {
{{#decor.before}}
  {{decor.before.arg}}();
{{/decor.before}}
{{#decor.after}}
  try {
    {{body}}
  } finally {
    {{decor.after.arg}}();
  }
{{/decor.after}}
{{^decor.after}}
  {{body}}
{{/decor.after}}
}
{{/decor.state}}
