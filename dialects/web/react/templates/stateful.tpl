{{#decor.screen.providers}}
/** @screen: builds {{#decor.screen.providers.items}}{{.}}{{^@last}}, {{/@last}}{{/decor.screen.providers.items}} once for this screen and provides them to its views. */
export function {{name}}(props: {{name}}Props{{^params_list}} = {}{{/params_list}}): Element {
  return createElement(Providers, {
    managers: [{{#decor.screen.providers.items}}{{.}}{{^@last}}, {{/@last}}{{/decor.screen.providers.items}}],
    children: createElement({{name}}View, props),
  });
}
{{/decor.screen.providers}}
{{^decor.screen.providers}}
export function {{name}}(props: {{name}}Props{{^params_list}} = {}{{/params_list}}): Element {
  return createElement({{name}}View, props);
}
{{/decor.screen.providers}}

export interface {{name}}Props {
  key?: string | number;
{{#params_list}}
  {{name}}{{#optional}}?{{/optional}}{{^optional}}{{#default}}?{{/default}}{{/optional}}: {{#type}}{{type}}{{/type}}{{^type}}unknown{{/type}};
{{/params_list}}
}

const {{name}}View = statefulOf(
  class extends StatefulView<{{name}}Props> {
    {{members}}
  },
);
