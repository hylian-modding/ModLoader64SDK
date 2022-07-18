const { register, addAsarToLookupPaths } = require('asar-node');
import { program } from 'commander';
import asar from 'asar';
import fs from 'fs-extra';
import path from 'path';
import { doBuild, doBuildSingle, doCopy } from './compiler';
import { template } from './template';
import child_process from 'child_process';
import { getAllFiles, getAllFolders } from './getAllFiles';
import AdmZip from 'adm-zip';
import { Pak } from './PakFormat';

register();
addAsarToLookupPaths();

program.option('-n, --init', 'init new project');
program.option("-c, --clean", "cleans build dirs");
program.option('-b, --build', 'build mod');
program.option('-d, --dist', 'pack mod');
program.option(`-i, --install <url>`, 'install core');
program.option('-r, --run', 'run mod');

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
    static gulp: boolean = false;
    static git: boolean = false;
}

let og: string = path.resolve(process.cwd());
let sdk: string = path.resolve(path.parse(process.execPath).dir);
if (fs.existsSync(path.resolve(sdk, "node.exe"))) {
    // Probably a weird setup?
    sdk = path.resolve(__dirname, "..");
}

const options: Opts = program.opts();

function checkGulp() {
    try {
        child_process.execSync("gulp -v", { stdio: 'pipe' })
        Tools.gulp = true;
        return true;
    } catch (err) {
    }
    return false;
}

function checkGit() {
    try {
        child_process.execSync("git --version", { stdio: 'pipe' })
        Tools.git = true;
        return true;
    } catch (err) {
    }
    return false;
}

function setupGulp(){
    if (fs.existsSync(path.resolve(og, "gulpfile.ts"))) {
        console.log(`gulp... ${checkGulp()}`);
        doBuildSingle(path.resolve(og, "gulpfile.ts"));
    }
}

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

try {
    if (!fs.existsSync(path.resolve(sdk, "client"))) {
        console.log("Extracting client...");
        asar.extractAll(path.resolve(sdk, "client.asar"), path.resolve(sdk, "client"));
        if (!fs.existsSync(path.resolve(sdk, "client/node_modules"))) {
            asar.extractAll(path.resolve(sdk, "client/node_modules.asar"), path.resolve(sdk, "client", "node_modules"));
        }
    }
} catch (err) { }

function init(_dir: string) {
    if (!fs.existsSync(path.resolve(_dir, "package.json"))) {
        let t = JSON.parse(JSON.stringify(template));
        t.name = path.parse(_dir).name;
        fs.writeFileSync(path.resolve(_dir, "package.json"), JSON.stringify(t, null, 2));
    }
    let meta = JSON.parse(fs.readFileSync(path.resolve(_dir, "package.json")).toString());
    if (!fs.existsSync(path.resolve(_dir, "node_modules"))) {
        fs.mkdirSync(path.resolve(_dir, "node_modules"));
        console.log("Linking ModLoader64 API to project...");
        console.log("This might take a moment. Please be patient.");
        fs.readdirSync(path.resolve(sdk, "client/node_modules")).forEach((dir: string) => {
            let d = path.resolve(sdk, "client/node_modules", dir);
            let d1 = path.resolve(_dir, "node_modules", path.parse(d).base);
            makeSymlink(d, d1);
        });
    }
    if (!fs.existsSync(path.resolve(_dir, "src"))) {
        fs.mkdirSync(path.resolve(_dir, "src"));
        fs.mkdirSync(path.resolve(_dir, "src", meta.name));
        fs.copyFileSync(path.resolve(_dir, "package.json"), path.resolve(_dir, "src", meta.name, "package.json"));
    }
    setupGulp();
}

function checkSymLinks() {
    let fail: boolean = false;
    let nm = path.resolve(og, "node_modules");
    fs.readdirSync(nm).forEach((dir: string) => {
        if (!fs.existsSync(path.resolve(nm, dir))) {
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
    console.log(`Building ${og}...`);
    setupGulp();
    if (Tools.gulp) {
        child_process.execSync("gulp", { stdio: "inherit" });
    } else {
        doBuild(og);
    }
    doCopy(og);
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

function install() {
    console.log(`git.... ${checkGit()}`);
    let c = path.resolve(sdk, "_cores");
    if (!fs.existsSync(c)) {
        fs.mkdirSync(c);
    }
    let url = options.install!.toString();
    if (!Tools.git) {
        console.error("You do not have git installed!");
        throw new Error("You do not have git installed!");
    } else {
        let name = path.parse(url).name;
        let dir = path.resolve(c, name);
        if (!fs.existsSync(dir)) {
            child_process.execSync(`git clone --recurse-submodules ${url} ${dir}`);
        }
        let meta = JSON.parse(fs.readFileSync(path.resolve(dir, "package.json")).toString());
        if (meta.name !== name) {
            name = meta.name;
        }
        console.log(dir);
        init(dir);
        doBuild(dir);
        doCopy(dir);
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

function run() {

}

if (options.init !== undefined) {
    init(og);
}
if (options.install !== undefined) {
    install();
}
if (options.clean !== undefined) {
    clean();
}
if (options.build !== undefined) {
    build();
}
if (options.dist !== undefined) {
    dist();
}
if (options.run !== undefined) {
    run();
}