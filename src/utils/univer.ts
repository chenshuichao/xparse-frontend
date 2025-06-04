export async function loadUniverSDK(): Promise<void> {
  if (window.UniverPresets) {
    return;
  }

  const scripts = [
    // Core dependencies
    '/univer@0.6.10/react@18.3.1.min.js',
    '/univer@0.6.10/react-dom@18.3.1.min.js',
    '/univer@0.6.10/rxjs.min.js',
    '/univer@0.6.10/echarts@5.6.0.min.js',
    '/univer@0.6.10/presets.index.js',
    '/univer@0.6.10/preset-sheets-core.index.js',
    '/univer@0.6.10/preset-sheets-core.locales.zh-CN.js',

    // Add polyfills as inline script
    {
      inline: true,
      content: `
            // Fix createRoot for React < 18
            (function (global) {
              'use strict';
              if (!global.ReactDOM) {
                throw new Error('ReactDOM must be loaded before ReactCreateRoot.');
              }
              const ReactDOM = global.ReactDOM;
              if (!ReactDOM.createRoot) {
                ReactDOM.createRoot = function (container) {
                  return {
                    render: (element) => {
                      ReactDOM.render(element, container);
                    },
                  };
                };
              }
            })(this);
    
            // Fix jsx/jsxs for UMD React
            (function (global) {
              'use strict';
              if (!global.React) {
                throw new Error('React must be loaded before ReactJSXRuntime.');
              }
              const React = global.React;
              if (!React.jsx || !React.jsxs) {
                const REACT_ELEMENT_TYPE = Symbol.for('react.element');
                const hasOwnProperty = Object.prototype.hasOwnProperty;
                const RESERVED_PROPS = {
                  key: true,
                  ref: true,
                  __self: true,
                  __source: true,
                };
                const ReactCurrentOwner = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
                function createReactElement(type, config, maybeKey) {
                  const props = {};
                  let key = null;
                  let ref = null;
                  if (maybeKey !== undefined) {
                    key = \`\${maybeKey}\`;
                  }
                  if (config.key !== undefined) {
                    key = \`\${config.key}\`;
                  }
                  if (config.ref !== undefined) {
                    ref = config.ref;
                  }
                  for (var propName in config) {
                    if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                      props[propName] = config[propName];
                    }
                  }
                  if (type && type.defaultProps) {
                    const defaultProps = type.defaultProps;
                    for (var propName in defaultProps) {
                      if (props[propName] === undefined) {
                        props[propName] = defaultProps[propName];
                      }
                    }
                  }
                  return {
                    $$typeof: REACT_ELEMENT_TYPE,
                    type,
                    key,
                    ref,
                    props,
                    _owner: ReactCurrentOwner.current,
                  };
                }
                React.jsx = createReactElement;
                React.jsxs = createReactElement;
              }
            })(this);
          `,
    },
  ];

  // CSS files
  const stylesheets = ['/univer@0.6.10/preset-sheets-core.index.css'];

  // Load scripts sequentially
  for (const script of scripts) {
    if (typeof script === 'string') {
      await loadScript(script);
    } else if (script.inline) {
      await executeInlineScript(script.content);
    }
  }

  // Load stylesheets (can be loaded in parallel)
  await Promise.all(stylesheets.map(loadStylesheet));
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = false; // Important to maintain execution order
    script.onload = () => {
      resolve();
    };
    script.onerror = (error) => {
      console.error(`Failed to load script: ${url}`);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

function executeInlineScript(content: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.textContent = content;
      document.head.appendChild(script);
      resolve();
    } catch (error) {
      console.error('Failed to execute inline script', error);
      // Still resolve to continue loading the rest
      resolve();
    }
  });
}

function loadStylesheet(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => {
      resolve();
    };
    link.onerror = (error) => {
      console.error(`Failed to load stylesheet: ${url}`);
      reject(error);
    };
    document.head.appendChild(link);
  });
}
