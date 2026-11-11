{{#decor.test}}
test({{decor.test.arg}}, async () => {
  {{body}}
});
{{/decor.test}}
{{#decor.widget}}
test({{decor.widget.arg}}, async () => {
  {{body}}
});
{{/decor.widget}}
{{#decor.states}}
test({{decor.states.arg}}, async () => {
  const {{#params_list}}{{name}}{{/params_list}} = inject({{#params_list}}{{type}}{{/params_list}});
  const states = await statesOf({{#params_list}}{{name}}{{/params_list}}, async () => {
    {{body}}
  });
  expect(states).toEqual({{decor.states.expect}});
});
{{/decor.states}}
{{^decor.test}}
{{^decor.widget}}
{{^decor.states}}
{{name}}(async () => {
  {{body}}
});
{{/decor.states}}
{{/decor.widget}}
{{/decor.test}}
