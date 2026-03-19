const isDev = import.meta.env.DEV;

const noop = () => {
  /* no-op */
};

export const logger = {
  debug: isDev ? console.debug.bind(console) : noop,
  log: isDev ? console.log.bind(console) : noop,
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};
