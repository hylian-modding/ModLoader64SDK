#!/usr/bin/env node

import { program } from 'commander';
import { IPakFileCompressionOptions, Pak } from './PakFormat';
import path from 'path';
import zip from 'adm-zip';
import fse from 'fs-extra';
import asar from 'asar';

let recursive = require('recursive-readdir');
require('mkdir-recursive');

program.option('-d --dir <dir>', 'base directory');
program.option('-i --input <pak>', 'pak to unpak');
program.option('-o, --output <dir>', 'output dir');
program.option("-j, --json <file>", "input json");
program.option("-a, --algo <algo>", "compression algo");
program.option("-c, --convert <zip>", "convert zip to pak");
program.option("-s, --asar <pak>", "convert pak to asar");
program.parse(process.argv);

interface Opts {
    convert?: string;
    dir?: string;
    json?: string;
    input?: string;
    output?: string;
    algo?: string;
    asar?: string;
}

const opts: Opts = program.opts();

if (opts.convert !== undefined) {
    let zipFile: zip = new zip(fse.readFileSync(opts.convert));
    zipFile.extractAllTo("./");
    let pak: Pak = new Pak("./" + path.parse(opts.convert).name + '.pak');
    recursive(path.join("./", path.parse(opts.convert).name), function (err: any, files: string[]) {
        console.log("Total files: " + files.length);
        for (let i = 0; i < files.length; i++) {
            pak.save_file(files[i], { enabled: true, algo: "DEFL" });
        }
        pak.update();
    });
}

if (opts.asar !== undefined){
    let pak: Pak = new Pak(opts.asar);
    pak.extractAll("./");
    let folder: string = ".";
    fse.readdirSync(".").forEach((f: string)=>{
        let f1 = path.resolve(".", f);
        if (fse.lstatSync(f1).isDirectory()){
            folder = f1;
        }
    });
    asar.createPackage(folder, `./${path.parse(opts.asar).name}.asar`).then(()=>{
        console.log("Conversion complete.");
    });
}

if (opts.dir !== undefined) {
    recursive(opts.dir, function (err: any, files: string[]) {
        if (opts.algo === "zip") {
            let zipFile: zip = new zip();
            zipFile.addLocalFolder(path.resolve(opts.dir!), path.parse(opts.dir!).name);
            zipFile.writeZip(path.resolve(opts.output + "/" + path.parse(opts.dir!).name + '.zip'));
        } else {
            opts
            let pak: Pak = new Pak(opts.output + "/" + path.parse(opts.dir!).name + '.pak');
            console.log("Total files: " + files.length);
            for (let i = 0; i < files.length; i++) {
                if (opts.algo !== undefined) {
                    console.log(i + " / " + files.length);
                    pak.save_file(files[i], { enabled: true, algo: opts.algo! });
                } else {
                    pak.save_file(files[i]);
                }
            }
            pak.update();
        }
    });
}

if (opts.json) {
    let pak: Pak = new Pak(opts.output!);
    pak.overwriteFileAtIndex(0, fse.readJSONSync(opts.json), { enabled: true, algo: "DEFL" } as IPakFileCompressionOptions);
    pak.update();
}

if (opts.input !== undefined) {
    let pak: Pak = new Pak(opts.input);
    pak.extractAll(opts.output!);
}
