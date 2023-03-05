"use strict";

const express = require("express");
const path = require("path");
const cors = require("cors");

require("dotenv").config({ path: path.resolve(__dirname + "/.env") });

const appName = process.env.APP_NAME || "node-kibana-app";
const port = process.env.PORT || 9000;
const ipAddress = process.env.IP || "127.0.0.1";

let bunyan = require("bunyan");
const log = bunyan.createLogger(
  {
    name: appName,
    streams: [
      {
        level: "debug",
        stream: process.stdout,
      },
      {
        level: "info",
        path: `${process.env.LOGS_DIR_BASE_PATH}/${appName}-out.log`
      }, {
        level: "error",
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

const users = {
  1: {
    name: "John Doe",
    age: 25,
    profession: "Software Engineer",
    hobbies: ["fishing", "carpentry", "hiking"]
  },
  2: {
    name: "Jane Doe",
    age: 32,
    profession: "Psychiatrist",
    hobbies: ["reading", "scuba diving", "dancing"]
  }
};

app.get("/", (req, res) => {
  const source = "healthCheck";
  const apiPath = req.path;
  try {
    log.info({ source, apiPath, subject: "health check" }, "status ok");
    return res.send("status ok");
  } catch (e) {
    log.error({ source, apiPath, subject: `error in ${source}` }, e);
  }
});

app.get("/users/:id", (req, res) => {
  const source = "getUserById";
  const apiPath = req.path;
  try {
    log.info({ source, apiPath, subject: "request params" }, req.params);
    let user = {};
    if (req.params.id in users && users[req.params.id]) {
      user = users[req.params.id];
      log.info({ source, apiPath, subject: `user found with id ${req.params.id}` }, user);
      return res.send(users[req.params.id]);
    }
    log.info({ source, apiPath, subject: `user not found with id ${req.params.id}` }, user);
    return res.send("User not found for given id");
  } catch (e) {
    log.error({ source, apiPath, subject: `error in ${source}` }, e);
  }
});

app.post("/users/:id", (req, res) => {
  const source = "createUserById";
  const apiPath = req.path;
  try {
    log.info({ source, apiPath, subject: "request params" }, req.body);
    req.params.id = req.params.id.trim();
    if (!req.params.id) {
      log.info({ source, apiPath, subject: `user creation failed` }, "missing req.params.id");
      return res.send("Parameter id is required");
    }
    if (!req.body || !Object.keys(req.body).length) {
      log.info({ source, apiPath, subject: `user creation failed` }, "missing req.body");
      return res.send("User cannot be empty");
    }
    let user = req.body;
    if (req.params.id in users && users[req.params.id]) {
      user = users[req.params.id];
      log.info({ source, apiPath, subject: `user already exists with id ${req.params.id}` }, user);
      return res.send("User already exists for given id");
    }
    log.info({ source, apiPath, subject: `user not found with id ${req.params.id}` }, user);
    users[req.params.id] = user;
    log.info({ source, apiPath, subject: `user creation successful` }, user);
    return res.send("New user created");
  } catch (e) {
    log.error({ source, apiPath, subject: `error in ${source}` }, e);
  }
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
