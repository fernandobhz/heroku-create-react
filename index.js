#!/usr/bin/env node
const fs = require(`fs/promises`);
const path = require(`path`);
const INI = require(`ini`);
const { exec: execCallback } = require(`child_process`);

const exec = (command) =>
  new Promise((resolve, reject) =>
    execCallback(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      log(stdout);
      consoleError(stderr);
      return resolve(`${stdout}\n${stderr}`);
    })
  );

const { log, error: consoleError } = console;

const die = (...args) => {
  consoleError(...args);
  process.exit(1);
};

async function buildAppName() {
  const gitConfigPath = path.join(process.cwd(), `.git`, `config`);
  const gitConfigContent = await fs.readFile(gitConfigPath, `utf8`);
  const gitConfig = INI.parse(gitConfigContent);
  const { url: originUrl } = gitConfig[`remote "origin"`];

  const originUrlParts = originUrl.split(`/`).reverse();
  const [projectName, userName] = originUrlParts;

  const herokuAppName = `${projectName}-${userName}`.replace(/\./g, `-`).slice(0, 30);
  return herokuAppName;
}

async function run() {
  const appName = await buildAppName();
  await exec(`heroku create ${appName} --buildpack mars/create-react-app`);
  await exec(`git push heroku`);
  await exec(`heroku open`);
}

run();
