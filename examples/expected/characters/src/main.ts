import { appRouter } from './dragonfly.g';
import { Element, RouterProvider, StatelessView, createElement, statelessOf } from 'dragonfly-web';

/** The app: the router with every @screen. index.ts (generated) starts Dragonfly and mounts App in #root. */
export function App(props: AppProps = {}): Element {
  return createElement(AppView, props);
}

export interface AppProps {
  key?: string | number;
}

const AppView = statelessOf(
  class extends StatelessView<AppProps> {
    override build(): Element {
      return createElement(RouterProvider, { router: appRouter() });
    }
  },
);
