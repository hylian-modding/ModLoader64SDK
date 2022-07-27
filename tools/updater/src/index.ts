#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import AdmZip from 'adm-zip';
const _download = require('download-file')

program.parse(process.argv);

let og: string = path.resolve(process.cwd());
let sdk: string = path.resolve(path.parse(process.execPath).dir);

function extract() {
    let zip: AdmZip;
    if (process.platform === "win32") {
        let options = {
            directory: sdk,
            filename: "windows.zip"
        };
        _download("https://repo.modloader64.com/dev/modloader64-sdk-win64.zip", options, () => {
            zip = new AdmZip(path.resolve(sdk, "windows.zip"));
            zip.extractAllTo(sdk);
        });
    } else if (process.platform === "linux") {
        let options = {
            directory: sdk,
            filename: "linux.zip"
        };
        _download("https://repo.modloader64.com/dev/modloader64-sdk-linux.zip", options, () => {
            zip = new AdmZip(path.resolve(sdk, "linux.zip"));
            zip.extractAllTo(sdk);
        });
    }
}

(async () => {
    extract();
})();