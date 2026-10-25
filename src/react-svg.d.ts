import 'react';

declare module 'react' {
  interface SVGAttributes<T> {
    translate?: 'yes' | 'no' | (string & {}) | undefined;
  }
}
