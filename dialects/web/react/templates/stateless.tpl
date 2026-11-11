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

const {{name}}View = statelessOf(
  class extends StatelessView<{{name}}Props> {
{{#params_list}}
{{#default}}
{{#@first}}
    constructor(props: {{name}}Props) {
      super({ ...props{{#params_list}}{{#default}}, {{name}}: props.{{name}} ?? {{default}}{{/default}}{{/params_list}} });
    }

{{/@first}}
{{/default}}
{{/params_list}}
    {{members}}
  },
);
