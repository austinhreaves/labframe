import axe from 'axe-core';

export async function runAxe(container: HTMLElement): Promise<axe.AxeResults> {
  return axe.run(container, {
    iframes: false,
    rules: {
      // jsdom does not compute enough layout/color details for this rule.
      'color-contrast': { enabled: false },
      // iframe internals are not available to jsdom-based tests.
      'frame-tested': { enabled: false },
    },
  });
}
