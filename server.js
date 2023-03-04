"use strict";

const express = require("express");
const path = require("path");
const cors = require("cors");

require("dotenv").config({ path: path.resolve(__dirname + "/.env") });

const appName = process.env.APP_NAME || "node-kibana-app";
const port = process.env.PORT || 9000;
const ipAddress = process.env.IP || "127.0.0.1";

let bunyan = require('bunyan');
const log = bunyan.createLogger(
  {
    name: appName,
    streams: [
      {
        level: 'debug',
        stream: process.stdout,
      },
      {
        level: 'info',
        path: `${process.env.LOGS_DIR_BASE_PATH}/${appName}-out.log`
      }, {
        level: 'error',
        path: `${process.env.LOGS_DIR_BASE_PATH}/${appName}-error.log`
      }
    ]
  }
);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = app.listen(port, ipAddress, () => {
  log.info(`Server for ${appName} started on ${ipAddress}:${port}`);
});

app.get("/", (req, res) => {
  log.info("status ok");
  res.send("status ok");
});

function gracefulShutdown(signalType) {
  return new Promise((resolve, reject) => {
    try {
      log.info(`${signalType} signal received.`);
      log.info("Closing http server.");
      server.close(async () => {
        log.info("Http server closed.");
        return resolve();
      });
    } catch (e) {
      log.error("gracefulShutdown error", e);
      return reject(e);
    }
  })
}

// catch ctrl+c event and exit normally
process.once("SIGINT", async () => {
  await gracefulShutdown("SIGINT");
})

process.once("SIGTERM", async () => {
  await gracefulShutdown("SIGTERM");
});

// catch "kill pid" (for example: nodemon restart)
process.once("SIGUSR1", async () => {
  await gracefulShutdown("SIGUSR1");
});
process.once("SIGUSR2", async () => {
  await gracefulShutdown("SIGUSR2");
});

//catch uncaught exceptions, trace, then exit normally
process.once("uncaughtException", async (e) => {
  log.error(e);
  await gracefulShutdown("uncaughtException");
});
