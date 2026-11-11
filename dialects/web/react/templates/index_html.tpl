<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{#app.title}}{{app.title}}{{/app.title}}{{^app.title}}{{project}}{{/app.title}}</title>
{{#app.description}}
    <meta name="description" content="{{app.description}}" />
{{/app.description}}
{{#asset.public_favicon_svg}}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
{{/asset.public_favicon_svg}}
{{#asset.public_styles_css}}
    <link rel="stylesheet" href="/styles.css" />
{{/asset.public_styles_css}}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.ts"></script>
  </body>
</html>
