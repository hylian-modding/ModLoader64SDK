import { program } from 'commander';
import asar from 'asar';
import fs from 'fs-extra';
import path from 'path';
import { doBuild, doBuildSingle, doCopy, SDKCompiler } from './compiler';
import { template } from './template';
import child_process, { ChildProcess } from 'child_process';
import { getAllFiles, getAllFolders } from './getAllFiles';
import AdmZip from 'adm-zip';
import { Pak } from './PakFormat';
import { clientcfgtemplate, clientcfgtemplate_nonhost } from './clientcfgtemplate';
import { ISDKConfig, SDKConfig } from './config';
import os from 'os';
import PluginManager from './plugins';

const arch: string = os.arch();
const platform: string = os.platform();
const oskey: string = `${platform}${arch}`;

class MLInstance {
    inst: ChildProcess;

    constructor(inst: ChildProcess) {
        this.inst = inst;
    }
}

const ML_INSTANCES: MLInstance[] = [];

function exitHandler() {
    var kill = require('tree-kill');
    ML_INSTANCES.forEach((inst: MLInstance) => {
        kill(inst.inst.pid, () => { });
    });
}

process.on('exit', exitHandler);

//catches ctrl+c event
process.on('SIGINT', exitHandler);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);

//catches uncaught exceptions
process.on('uncaughtException', exitHandler);

program.option('-n, --init', 'init new project');
program.option("-c, --clean", "cleans build dirs");
program.option('-b, --build', 'build mod');
program.option('-d, --dist', 'pack mod');
program.option('-r, --run <id>', 'run mod');
program.option('-f, --flags <flags>', 'compiler flags');

program.allowUnknownOption(true);
program.parse(process.argv);

console.log(`ModLoader64 SDK v3.0.0`);

interface Opts {
    init?: boolean;
    build?: boolean;
    clean?: boolean;
    dist?: boolean;
    install?: boolean;
    run?: boolean;
    flags?: boolean;
}

let og: string = path.resolve(process.cwd());
let sdk: string = path.resolve(path.parse(process.execPath).dir);

const plugins = new PluginManager(sdk);

let config: ISDKConfig = new SDKConfig(path.resolve(sdk, "roms"));
let config_file: string = path.resolve(sdk, "SDK-Config.json");
if (!fs.existsSync(config_file)) {
    fs.writeFileSync(config_file, JSON.stringify(config, null, 2));
}
config = JSON.parse(fs.readFileSync(config_file).toString());

const options: Opts = program.opts();

function makeSymlink(src: string, dest: string) {
    try {
        let p = path.parse(dest);
        if (!fs.existsSync(p.dir)) {
            fs.mkdirSync(p.dir);
        }
        fs.symlinkSync(src, dest, 'junction');
    } catch (err) {
        //console.log(err);
    }
}

try {
    let n: string = "windows";
    if (oskey === "linuxx64") {
        n = "linux";
    }
    let md5: Buffer = Buffer.from("DEADBEEF", 'hex');
    if (fs.existsSync(path.join(__dirname, `${n}.md5`))) {
        md5 = fs.readFileSync(path.join(__dirname, `${n}.md5`));
    }
    let client_folder = path.resolve(sdk, "client");
    let backups: Map<string, Buffer> = new Map();
    let mupen_config: string = path.resolve(client_folder, "emulator", "mupen64plus.cfg");
    let overwrite: boolean = false;
    if (fs.existsSync(client_folder)) {
        let hash = Buffer.from("DEADBEEF", 'hex');
        if (fs.existsSync(path.resolve(client_folder, "client.md5"))) {
            hash = fs.readFileSync(path.resolve(client_folder, "client.md5"));
        }
        if (!md5.equals(hash)) {
            if (fs.existsSync(mupen_config)){
                backups.set(mupen_config, fs.readFileSync(mupen_config));
            }
            overwrite = true;
        }
    }
    if (!fs.existsSync(client_folder) || overwrite) {
        console.log("Extracting client...");
        let z = fs.readFileSync(path.join(__dirname, `${n}.zip`));
        let zip = new AdmZip(z);
        zip.extractAllTo(path.resolve(sdk));
        asar.extractAll(path.resolve(sdk, `${n}.asar`), client_folder);
        fs.removeSync(path.resolve(sdk, `${n}.asar`));
        fs.writeFileSync(path.resolve(client_folder, "client.md5"), md5);
        backups.forEach((value: Buffer, key: string) => {
            fs.writeFileSync(key, value);
        });
        fs.copyFileSync(process.execPath, path.resolve(client_folder, path.parse(process.execPath).base));
    }
} catch (err) {
    if (err) console.error(err);
}

function init(_dir: string) {
    if (!fs.existsSync(path.resolve(_dir, "package.json"))) {
        let t = JSON.parse(JSON.stringify(template));
        t.name = path.parse(_dir).name;
        fs.writeFileSync(path.resolve(_dir, "package.json"), JSON.stringify(t, null, 2));
    }
    let meta = JSON.parse(fs.readFileSync(path.resolve(_dir, "package.json")).toString());
    if (!fs.existsSync(path.resolve(_dir, "node_modules"))) {
        fs.mkdirSync(path.resolve(_dir, "node_modules"));
    }
    console.log("Linking ModLoader64 API to project...");
    console.log("This might take a moment. Please be patient.");
    fs.readdirSync(path.resolve(sdk, "client/node_modules")).forEach((dir: string) => {
        let d = path.resolve(sdk, "client/node_modules", dir);
        let d1 = path.resolve(_dir, "node_modules", path.parse(d).base);
        if (!fs.existsSync(d1)) {
            makeSymlink(d, d1);
        }
    });
    fs.readdirSync(path.resolve(sdk, "client/cores")).forEach((dir: string) => {
        let d = path.resolve(sdk, "client/cores", dir);
        let d1 = path.resolve(_dir, "node_modules", path.parse(d).base);
        if (!fs.existsSync(d1)) {
            makeSymlink(d, d1);
        }
    });
    if (!fs.existsSync(path.resolve(_dir, "src"))) {
        fs.mkdirSync(path.resolve(_dir, "src"));
        fs.mkdirSync(path.resolve(_dir, "src", meta.name));
        fs.copyFileSync(path.resolve(_dir, "package.json"), path.resolve(_dir, "src", meta.name, "package.json"));
    }
}

function checkSymLinks() {
    let fail: boolean = false;
    let nm = path.resolve(og, "node_modules");
    if (!fs.existsSync(nm)) return;
    fs.readdirSync(nm).forEach((dir: string) => {
        if (!fs.existsSync(path.resolve(nm, dir)) && dir !== ".yarn-integrity") {
            console.log(dir);
            if (!fail) fail = true;
        }
    });
    if (fail) {
        console.log("API symlinks appear to be broken in this project. Attempting repair...");
        fs.removeSync(nm);
        init(og);
    }
}

function build() {
    checkSymLinks();
    let meta: any = JSON.parse(fs.readFileSync(path.resolve(og, "package.json")).toString());
    console.log(`Building ${og}...`);
    if (meta.hasOwnProperty("scripts")) {
        if (meta.scripts.hasOwnProperty("MLPreBuildScript")) {
            let s = meta.scripts.MLPreBuildScript;
            if (path.parse(s).ext === ".ts") {
                s = doBuildSingle(path.resolve(og, s));
            } else {
                s = path.resolve(og, s);
            }
            child_process.fork(s, { stdio: 'inherit' });
        }
    }
    doCopy(og);
    let flags: string[] = [];
    if (options.flags !== undefined) {
        flags = options.flags.toString().split(",");
    }
    doBuild(og, flags);
    if (meta.hasOwnProperty("scripts")) {
        if (meta.scripts.hasOwnProperty("MLBuildScript")) {
            let s = meta.scripts.MLBuildScript;
            if (path.parse(s).ext === ".ts") {
                s = doBuildSingle(path.resolve(og, s));
            } else {
                s = path.resolve(og, s);
            }
            child_process.fork(s, { stdio: 'inherit' });
        }
    }
}

function clean() {
    if (fs.existsSync(path.resolve(og, "build"))) {
        fs.removeSync(path.resolve(og, "build"));
    }
    if (fs.existsSync(path.resolve(og, "dist"))) {
        fs.removeSync(path.resolve(og, "dist"));
    }
}

function dist() {
    let d = path.resolve(og, "dist");
    if (!fs.existsSync(d)) {
        fs.mkdirSync(d);
    }
    let b = path.resolve(og, "build");
    fs.copySync(b, d);

    let folders = getAllFolders(d, []);

    folders.forEach((folder: string) => {
        let n = path.parse(folder).name;
        let zipFile: AdmZip = new AdmZip();
        zipFile.addLocalFolder(folder, path.parse(folder).name);
        zipFile.writeZip(path.resolve(d, `${n}.zip`));
        let pak: Pak = new Pak(path.resolve(d, `${n}.pak`));
        let files = getAllFiles(folder, []);
        console.log("Total files: " + files.length);
        process.chdir(d);
        for (let i = 0; i < files.length; i++) {
            let r = path.join(".", path.relative(process.cwd(), files[i]));
            pak.save_file(r);
        }
        process.chdir(og);
        pak.update();
    });
}

function install(skipClone: boolean = false, url: string = "") {
}

const ML_ARGS: string[] = [`--forceclientmode`, `--roms "${config.rom_directory}"`, `--cores "${path.resolve(sdk, "client", "cores")}"`, `--mods "${path.resolve(og, "build")}"`, `--startdir "${og}"`];

function run(index: number) {
    if (index > 0) {
        if (!fs.existsSync(path.resolve(og, `ModLoader64-config-player${index}.json`))) {
            fs.writeFileSync(path.resolve(og, `ModLoader64-config-player${index}.json`), JSON.stringify(clientcfgtemplate_nonhost, null, 2));
        }

    } else {
        if (!fs.existsSync(path.resolve(og, `ModLoader64-config-player${index}.json`))) {
            fs.writeFileSync(path.resolve(og, `ModLoader64-config-player${index}.json`), JSON.stringify(clientcfgtemplate, null, 2));
        }
    }
    setTimeout(() => {
        let args: string[] = [`--windowTitle Player_${index}`];
        for (let i = 0; i < ML_ARGS.length; i++) {
            args.push(ML_ARGS[i]);
        }
        args.push(`--config "${path.resolve(og, `ModLoader64-config-player${index}.json`)}"`);
        console.log(`Starting client with args: ${process.execPath} ${args.join(" ")}`);
        ML_INSTANCES.push(new MLInstance(child_process.spawn(path.resolve(sdk, "client", path.parse(process.execPath).base), args, { shell: true, stdio: 'inherit', cwd: path.resolve(sdk, "client") })));
    }, index * 1000);
}

if (options.init !== undefined) {
    let ctx = () => { init(og); };
    if (plugins.plugins.length > 0) {
        for (let i = 0; i < plugins.plugins.length; i++) {
            ctx = plugins.plugins[i].init(og, sdk, ctx);
        }
    }
    ctx();
}
if (options.install !== undefined) {
    install();
}
if (options.clean !== undefined) {
    clean();
}
if (options.build !== undefined) {
    let comp = new SDKCompiler();
    let ctx = () => { build(); };
    if (plugins.plugins.length > 0) {
        for (let i = 0; i < plugins.plugins.length; i++) {
            ctx = plugins.plugins[i].build(og, sdk, ctx, comp);
        }
    }
    ctx();
}
if (options.dist !== undefined) {
    let ctx = () => { dist(); };
    if (plugins.plugins.length > 0) {
        for (let i = 0; i < plugins.plugins.length; i++) {
            ctx = plugins.plugins[i].dist(og, sdk, ctx);
        }
    }
    ctx();
}
if (options.run !== undefined) {
    run(parseInt(options.run as any));
}