// HTML without JSX: div({ className: 'row', children: [h1('Characters'), ...] }), button({ onClick, children: 'Go' }).
// A string, a number, an element or a list given in place of the props is the children.
import { createElement, Fragment, ReactElement, ReactNode } from 'react';
import type { JSX } from 'react';

type Props<T extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[T] & { key?: string | number };
type Arg<T extends keyof JSX.IntrinsicElements> = Props<T> | ReactNode;

function isProps(a: unknown): a is Record<string, unknown> {
  return typeof a === 'object' && a !== null && !Array.isArray(a) && !('$$typeof' in a);
}

/** `el('div', props, ...children)`: createElement with the children in the props or after them. */
export function el<T extends keyof JSX.IntrinsicElements>(tag: T, ...args: Arg<T>[]): ReactElement {
  const [first, ...rest] = args;
  if (isProps(first)) {
    const { children, key, ...props } = first as Record<string, unknown> & { children?: ReactNode; key?: string | number };
    // a list given as `children` is the element's children in order (positional, so React asks no keys of them)
    const kids = children === undefined ? rest : Array.isArray(children) ? children : [children];
    return createElement(tag, key !== undefined ? { ...props, key } : props, ...(kids as ReactNode[]));
  }
  return createElement(tag, null, ...(args as ReactNode[]));
}

/** An HTML function: the props first (their callbacks typed: `onChange: (e) => e.target.value`), or only children. */
interface Tag<T extends keyof JSX.IntrinsicElements> {
  (props: Props<T>, ...children: ReactNode[]): ReactElement;
  (...children: ReactNode[]): ReactElement;
}

const tag = <T extends keyof JSX.IntrinsicElements>(name: T): Tag<T> =>
  ((...args: Arg<T>[]) => el(name, ...args)) as Tag<T>;

/** Several elements without a wrapper. */
export const fragment = (...children: ReactNode[]): ReactElement => createElement(Fragment, null, ...children);

export const a = tag('a');
export const article = tag('article');
export const aside = tag('aside');
export const button = tag('button');
export const div = tag('div');
export const em = tag('em');
export const footer = tag('footer');
export const form = tag('form');
export const h1 = tag('h1');
export const h2 = tag('h2');
export const h3 = tag('h3');
export const h4 = tag('h4');
export const header = tag('header');
export const hr = tag('hr');
export const img = tag('img');
export const input = tag('input');
export const label = tag('label');
export const li = tag('li');
export const main = tag('main');
export const nav = tag('nav');
export const ol = tag('ol');
export const option = tag('option');
export const p = tag('p');
export const pre = tag('pre');
export const section = tag('section');
export const select = tag('select');
export const small = tag('small');
export const span = tag('span');
export const strong = tag('strong');
export const table = tag('table');
export const tbody = tag('tbody');
export const td = tag('td');
export const textarea = tag('textarea');
export const th = tag('th');
export const thead = tag('thead');
export const tr = tag('tr');
export const ul = tag('ul');
