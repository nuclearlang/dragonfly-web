{{#async}}async {{/async}}{{name}}({{params}}){{#ret}}: {{ret}}{{/ret}} {
{{#decor.requires}}
  const denied = Guards.check({ {{decor.requires.args}} });
  if (denied !== null) return Err({{#ret_info.err_is.string}}denied{{/ret_info.err_is.string}}{{^ret_info.err_is.string}}new {{ret_info.err}}({ message: denied }){{/ret_info.err_is.string}});
{{/decor.requires}}
{{#decor.acl}}
  const forbidden = {{#async}}await Guards.verify{{/async}}{{^async}}Guards.verifySync{{/async}}({ {{decor.acl.args}} });
  if (forbidden !== null) return Err({{#ret_info.err_is.string}}forbidden{{/ret_info.err_is.string}}{{^ret_info.err_is.string}}new {{ret_info.err}}({ message: forbidden }){{/ret_info.err_is.string}});
{{/decor.acl}}
  {{body}}
}
