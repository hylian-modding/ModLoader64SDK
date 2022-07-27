#!/usr/bin/env node

/*
 This program is kind of stupid. Its purpose is to recompile nightly mods that are pak'd to see if they need updates.
 */

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { getAllFiles } from './getAllFiles';

program.option('-i, --input <path>', 'src');
program.parse(process.argv);

let sdk: string = path.resolve(path.parse(process.execPath).dir);

interface Opts {
    input?: string;
}

const gl = `declare namespace NodeJS {
    export interface Global {
      ModLoader: any
    }
  }`;

const opts: Opts = program.opts();

if (opts.input !== undefined) {
    let name = path.parse(opts.input!).name;
    let og = process.cwd();
    let proj = path.resolve(".", name);
    let src = path.resolve(proj, "src");
    if (!fs.existsSync(proj)) {
        fs.mkdirSync(proj);
        process.chdir(proj);
        child_process.execSync("modloader64 -n", { stdio: 'inherit' });
        process.chdir(og);
        child_process.execSync(`paker -i "${path.resolve(opts.input!)}" -o "${src}"`, { stdio: 'inherit' });
    }
    let files = getAllFiles(src, []);
    files.forEach((file: string) => {
        if (file.indexOf(".d.ts") > -1 || file.indexOf(".map") > -1 || path.parse(file).ext === ".js") {
            console.log(file);
            fs.unlinkSync(file);
        }
    });
    process.chdir(proj);
    fs.writeFileSync("./src/global.d.ts", Buffer.from(gl));
    child_process.execSync('modloader64 -cbd', { stdio: 'inherit' });
}