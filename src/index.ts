const { register, addAsarToLookupPaths } = require('asar-node');
import fs from 'fs';
import path from 'path';
import { argv } from 'process';

register();
addAsarToLookupPaths();

global["MLASARSUPPORT"] = true;

let og: string = path.resolve(process.cwd());

if (fs.existsSync(path.resolve(og, "client.md5")) || argv.indexOf("--forceclientmode") > -1) {
    require(path.join(__dirname, "client.js"));
} else {
    require(path.join(__dirname, "sdk.js"));
}