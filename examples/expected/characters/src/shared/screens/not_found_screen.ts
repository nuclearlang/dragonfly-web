import { Element, StatelessView, createElement, p, statelessOf } from 'dragonfly-web';

export function NotFoundScreen(props: NotFoundScreenProps = {}): Element {
  return createElement(NotFoundScreenView, props);
}

export interface NotFoundScreenProps {
  key?: string | number;
}

const NotFoundScreenView = statelessOf(
  class extends StatelessView<NotFoundScreenProps> {
    override build(): Element {
      return p({ children: 'There is nothing here.' });
    }
  },
);
