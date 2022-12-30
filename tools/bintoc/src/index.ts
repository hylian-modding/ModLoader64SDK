#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';

program.option('-i, --input <file>', 'input file');
program.parse(process.argv);

interface Opts {
    input?: string;
}

const opts: Opts = program.opts();


if (opts.input) {
    let name = path.parse(opts.input).name.split(" ").join("_").split("-").join("_");
    let buf: Buffer = fs.readFileSync(opts.input);

    let output_h: string[] = [];

    output_h.push(`#ifndef ${name.toUpperCase()}_H`);
    output_h.push(`#define ${name.toUpperCase()}_H`);
    output_h.push(`extern const u8 ${name}[${buf.byteLength}];`);

    output_h.push(`const u8 ${name}[${buf.byteLength}] = {`);

    output_h.push(buf.join(','));

    output_h.push("};");

    output_h.push("#endif");

    fs.writeFileSync(path.resolve(path.parse(opts.input).dir, name + ".h"), output_h.join('\n'));
}