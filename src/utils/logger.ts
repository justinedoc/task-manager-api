import pino from "pino";

const logger = pino.default({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: true,
      ignore: "pid,hostname",
      hideObject: false,
      supportEmoji: true,
    },
  },
});

export default logger;

