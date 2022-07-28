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

const ML_CORES: Map<string, string> = new Map();
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
program.option(`-i, --install <url>`, 'install core');
program.option('-r, --run <num>', 'run mod');

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
}

class Tools {
    static git: boolean = false;
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

if (fs.existsSync(path.resolve(sdk, "_cores"))) {
    fs.readdirSync(path.resolve(sdk, "_cores")).forEach((f: string) => {
        let dir = path.resolve(sdk, "_cores", f);
        if (fs.lstatSync(dir).isDirectory() || fs.lstatSync(dir).isSymbolicLink()) {
            let meta = JSON.parse(fs.readFileSync(path.resolve(dir, "package.json")).toString());
            ML_CORES.set(meta.name, dir);
            console.log(`Detected installed core: ${meta.name}`);
        }
    });
}

const options: Opts = program.opts();

function checkGit() {
    try {
        child_process.execSync("git --version", { stdio: 'pipe' })
        Tools.git = true;
        return true;
    } catch (err) {
    }
    return false;
}

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
            backups.set(mupen_config, fs.readFileSync(mupen_config));
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
        asar.extractAll(path.resolve(sdk, "client/node_modules.asar"), path.resolve(sdk, "client", "node_modules"));
        fs.removeSync(path.resolve(sdk, "client/node_modules.asar"));
        fs.writeFileSync(path.resolve(client_folder, "client.md5"), md5);
        backups.forEach((value: Buffer, key: string) => {
            fs.writeFileSync(key, value);
        });
        fs.copyFileSync(process.execPath, path.resolve(client_folder, path.parse(process.execPath).base));
    }
} catch (err) {
    //if (err) console.error(err);
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
    ML_CORES.forEach((value: string, key: string) => {
        install(true, value);
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
    doBuild(og);
    doCopy(og);
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
    console.log(`git.... ${checkGit()}`);
    let c = path.resolve(sdk, "_cores");
    if (!fs.existsSync(c)) {
        fs.mkdirSync(c);
    }
    if (url === "") url = options.install!.toString();
    if (!Tools.git) {
        console.error("You do not have git installed!");
        throw new Error("You do not have git installed!");
    } else {
        let name = path.parse(url).name;
        let dir = path.resolve(c, name);
        if (!fs.existsSync(dir) && !skipClone) {
            child_process.execSync(`git clone --recurse-submodules ${url} ${dir}`);
        }
        let meta = JSON.parse(fs.readFileSync(path.resolve(dir, "package.json")).toString());
        if (meta.name !== name) {
            name = meta.name;
        }
        if (!skipClone) {
            init(dir);
            doBuild(dir);
            doCopy(dir);
        }
        let folders = getAllFolders(path.resolve(dir, "build"), []);
        while (folders.length > 1) {
            folders.pop();
        }
        let folder = folders.pop()!;
        let client_core_folder = path.resolve(sdk, "client", "cores");
        if (!fs.existsSync(client_core_folder)) {
            fs.mkdirSync(client_core_folder);
        }
        makeSymlink(folder, path.resolve(client_core_folder, name));
        makeSymlink(folder, path.resolve(og, "node_modules", name));
    }
}

const ML_ARGS: string[] = [`--forceclientmode`, `--roms "${config.rom_directory}"`, `--cores "${path.resolve(sdk, "client", "cores")}"`, `--mods "${path.resolve(og, "build")}"`];

function run(numOfInstances: number) {
    for (let i = 0; i < numOfInstances; i++) {
        if (i > 0) {
            if (!fs.existsSync(path.resolve(og, `ModLoader64-config-player${i + 1}.json`))){
                fs.writeFileSync(path.resolve(og, `ModLoader64-config-player${i + 1}.json`), JSON.stringify(clientcfgtemplate_nonhost, null, 2));
            }
        } else {
            if (!fs.existsSync(path.resolve(og, `ModLoader64-config-player${i + 1}.json`))){
                fs.writeFileSync(path.resolve(og, `ModLoader64-config-player${i + 1}.json`), JSON.stringify(clientcfgtemplate, null, 2));
            }
        }
        setTimeout(() => {
            let args: string[] = [];
            for (let i = 0; i < ML_ARGS.length; i++) {
                args.push(ML_ARGS[i]);
            }
            args.push(`--config "${path.resolve(og, `ModLoader64-config-player${i + 1}.json`)}"`);
            console.log(`Starting client with args: ${process.execPath} ${args.join(" ")}`);
            ML_INSTANCES.push(new MLInstance(child_process.spawn(path.resolve(sdk, "client", path.parse(process.execPath).base), args, { shell: true, detached: true, cwd: path.resolve(sdk, "client") })));
        }, i * 1000);
    }
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
    run(parseInt(options.run.toString()));
}