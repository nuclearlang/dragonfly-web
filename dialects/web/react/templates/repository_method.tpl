{{#ret_info.result}}
{{name}}({{params}}): {{ret}} {
  return this.result(
    () =>
      this.send(HttpMethod.{{#decor.get}}get{{/decor.get}}{{#decor.post}}post{{/decor.post}}{{#decor.put}}put{{/decor.put}}{{#decor.patch}}patch{{/decor.patch}}{{#decor.delete}}delete{{/decor.delete}}, {{#deco_args.path}}{{deco_args.path}}{{/deco_args.path}}{{^deco_args.path}}''{{/deco_args.path}}, {
{{#param_groups.plain}}
        params: { {{#list}}{{name}}{{^@last}}, {{/@last}}{{/list}} },
{{/param_groups.plain}}
{{#param_groups.path}}
        pathParams: { {{#list}}{{name}}{{^@last}}, {{/@last}}{{/list}} },
{{/param_groups.path}}
{{#param_groups.query}}
        query: { {{#list}}{{name}}{{^@last}}, {{/@last}}{{/list}} },
{{/param_groups.query}}
{{#param_groups.body}}
        body: {{#list}}{{name}}{{/list}},
{{/param_groups.body}}
{{#deco_args.headers}}
        headers: {{deco_args.headers}},
{{/deco_args.headers}}
{{#deco_args.cache}}
        cache: new Cache({ {{#deco_args.cacheKey}}key: {{deco_args.cacheKey}}{{#deco_args.ttl}}, {{/deco_args.ttl}}{{/deco_args.cacheKey}}{{#deco_args.ttl}}ttl: {{deco_args.ttl}}{{/deco_args.ttl}} }),
        cacheName: '{{owner}}.{{name}}',
{{/deco_args.cache}}
{{#deco_args.retry}}
        retry: {{deco_args.retry}},
{{/deco_args.retry}}
        decode: {{#ret_info.void}}Decode.none{{/ret_info.void}}{{^ret_info.void}}{{#ret_info.model}}{{#ret_info.list}}Decode.list({{ret_info.item}}.fromJson){{/ret_info.list}}{{^ret_info.list}}{{#ret_info.args}}{{#@first}}Decode.one((json) => {{ret_info.name}}.fromJson(json{{/@first}}, {{#model}}(o) => {{item}}.fromJson(o as Json){{/model}}{{^model}}(o) => o as {{type}}{{/model}}{{#@last}})){{/@last}}{{/ret_info.args}}{{^ret_info.args}}Decode.one({{ret_info.item}}.fromJson){{/ret_info.args}}{{/ret_info.list}}{{/ret_info.model}}{{^ret_info.model}}{{#ret_info.list}}Decode.values<{{ret_info.item}}>(){{/ret_info.list}}{{^ret_info.list}}Decode.value<{{ret_info.type}}>(){{/ret_info.list}}{{/ret_info.model}}{{/ret_info.void}},
      }),
    (e) => {{#ret_info.err_is.string}}e.message{{/ret_info.err_is.string}}{{^ret_info.err_is.string}}new {{ret_info.err}}({ message: e.message }){{/ret_info.err_is.string}},
  );
}
{{/ret_info.result}}
{{^ret_info.result}}
{{name}}({{params}}): {{ret}} {
  return this.send(HttpMethod.{{#decor.get}}get{{/decor.get}}{{#decor.post}}post{{/decor.post}}{{#decor.put}}put{{/decor.put}}{{#decor.patch}}patch{{/decor.patch}}{{#decor.delete}}delete{{/decor.delete}}, {{#deco_args.path}}{{deco_args.path}}{{/deco_args.path}}{{^deco_args.path}}''{{/deco_args.path}}, {
{{#param_groups.plain}}
    params: { {{#list}}{{name}}{{^@last}}, {{/@last}}{{/list}} },
{{/param_groups.plain}}
{{#param_groups.path}}
    pathParams: { {{#list}}{{name}}{{^@last}}, {{/@last}}{{/list}} },
{{/param_groups.path}}
{{#param_groups.query}}
    query: { {{#list}}{{name}}{{^@last}}, {{/@last}}{{/list}} },
{{/param_groups.query}}
{{#param_groups.body}}
    body: {{#list}}{{name}}{{/list}},
{{/param_groups.body}}
{{#deco_args.headers}}
    headers: {{deco_args.headers}},
{{/deco_args.headers}}
{{#deco_args.cache}}
    cache: new Cache({ {{#deco_args.cacheKey}}key: {{deco_args.cacheKey}}{{#deco_args.ttl}}, {{/deco_args.ttl}}{{/deco_args.cacheKey}}{{#deco_args.ttl}}ttl: {{deco_args.ttl}}{{/deco_args.ttl}} }),
    cacheName: '{{owner}}.{{name}}',
{{/deco_args.cache}}
{{#deco_args.retry}}
    retry: {{deco_args.retry}},
{{/deco_args.retry}}
    decode: {{#ret_info.void}}Decode.none{{/ret_info.void}}{{^ret_info.void}}{{#ret_info.model}}{{#ret_info.list}}Decode.list({{ret_info.item}}.fromJson){{/ret_info.list}}{{^ret_info.list}}{{#ret_info.args}}{{#@first}}Decode.one((json) => {{ret_info.name}}.fromJson(json{{/@first}}, {{#model}}(o) => {{item}}.fromJson(o as Json){{/model}}{{^model}}(o) => o as {{type}}{{/model}}{{#@last}})){{/@last}}{{/ret_info.args}}{{^ret_info.args}}Decode.one({{ret_info.item}}.fromJson){{/ret_info.args}}{{/ret_info.list}}{{/ret_info.model}}{{^ret_info.model}}{{#ret_info.list}}Decode.values<{{ret_info.item}}>(){{/ret_info.list}}{{^ret_info.list}}Decode.value<{{ret_info.type}}>(){{/ret_info.list}}{{/ret_info.model}}{{/ret_info.void}},
  });
}
{{/ret_info.result}}
{{#deco_args.cache}}

purge{{name|pascal}}(): void {
  this.purgeCache({{#deco_args.cacheKey}}{{deco_args.cacheKey}}{{/deco_args.cacheKey}}{{^deco_args.cacheKey}}'{{owner}}.{{name}}'{{/deco_args.cacheKey}});
}
{{/deco_args.cache}}
