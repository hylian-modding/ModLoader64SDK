#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';

program.option('-i, --input <file>', 'input file');
program.option('-d, --dir <dir>', 'directory');
program.option('-r, --remove <str>', 'remove string from output');
program.option('-e, --encode <str>', 'encoding mode');
program.parse(process.argv);

interface Opts {
    encode?: string;
    input?: string;
    dir?: string;
    remove?: string;
}

const opts: Opts = program.opts();

let e: any = 'base64';
if (opts.encode !== undefined) {
    e = opts.encode!;
}

if (opts.input) {
    let str: string = "export const " + path.parse(opts.input).name.split(" ").join("_").split("-").join("_") + ": Buffer = Buffer.from(\"";
    let buf: Buffer = fs.readFileSync(opts.input);
    str += buf.toString(e);
    str += `\", '${e}');\n`;
    fs.writeFileSync(path.resolve(path.parse(opts.input).dir, path.parse(opts.input).name.split(" ").join("_").split("-").join("_") + ".ts"), str);
} else if (opts.dir) {
    var recursive = require("recursive-readdir");
    let dir = path.resolve(opts.dir);
    let str: string = "";
    recursive(dir, (err: any, files: Array<string>) => {
        for (let i = 0; i < files.length; i++) {
            let f = path.resolve(files[i]);
            if (opts.remove) {
                str += "export const " + path.parse(f).name.split(" ").join("_").split("-").join("_").replace(opts.remove, "") + ": Buffer = Buffer.from(\"";
            } else {
                str += "export const " + path.parse(f).name.split(" ").join("_").split("-").join("_") + ": Buffer = Buffer.from(\"";
            }
            let buf: Buffer = fs.readFileSync(f);
            str += buf.toString(e);
            str += `\", '${e}');\n`;
        }
        fs.writeFileSync(path.resolve(dir, path.parse(dir).name.split(" ").join("_").split("-").join("_") + ".ts"), str);
    });
}