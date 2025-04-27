import pino from "pino";

const logger = pino.default(
  process.env.ENV || "development" === "development"
    ? {
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
      }
    : {
        formatters: {
          level(label) {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
);

export default logger;
