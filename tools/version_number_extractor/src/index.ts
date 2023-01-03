#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';

program.parse(process.argv);

let sdk: string = path.resolve(path.parse(process.execPath).dir);

interface Opts {
}

const opts: Opts = program.opts();

let target = path.resolve("../package.json");
let meta = JSON.parse(fs.readFileSync(target).toString());
let version = meta.version;
let output = `export MYPKG_VERSION="${version}"`;
fs.writeFileSync("./version.sh", Buffer.from(output));