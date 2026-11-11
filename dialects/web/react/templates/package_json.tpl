{
  "name": "{{project|kebab}}",
  "version": "{{app.version}}",
{{#app.description}}
  "description": "{{app.description}}",
{{/app.description}}
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "dragonfly-web": "^0.1.0",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "react-router": "^7.18.0"{{#plugins.packages}},
    "{{name}}": "{{version}}"{{/plugins.packages}}
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "jsdom": "^28.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.3.0",
    "vitest": "^4.1.0"
  }
}
