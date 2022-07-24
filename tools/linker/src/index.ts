#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';

program.option('-s, --src <path>', 'src');
program.option('-d, --dest <dest>', 'dest');
program.parse(process.argv);

let sdk: string = path.resolve(path.parse(process.execPath).dir);

interface Opts {
    src?: string;
    dest?: string;
}

const opts: Opts = program.opts();

function makeSymlink(src: string, dest: string) {
    try {
        let p = path.parse(dest);
        if (!fs.existsSync(p.dir)) {
            fs.mkdirSync(p.dir);
        }
        fs.symlinkSync(src, dest, 'junction');
    } catch (err) {
        console.log(err);
    }
}

if (opts.src !== undefined) {
    if (opts.dest === undefined) {
        makeSymlink(path.resolve(opts.src), path.resolve(sdk, "node_modules", path.parse(path.resolve(opts.src)).name));
    } else {
        makeSymlink(path.resolve(opts.src), path.resolve(opts.dest, path.parse(path.resolve(opts.src)).name));
    }
}

