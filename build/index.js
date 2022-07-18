"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var _a = require('asar-node'), register = _a.register, addAsarToLookupPaths = _a.addAsarToLookupPaths;
var commander_1 = require("commander");
var asar_1 = __importDefault(require("asar"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var compiler_1 = require("./compiler");
var template_1 = require("./template");
var child_process_1 = __importDefault(require("child_process"));
var getAllFiles_1 = require("./getAllFiles");
var adm_zip_1 = __importDefault(require("adm-zip"));
var PakFormat_1 = require("./PakFormat");
register();
addAsarToLookupPaths();
commander_1.program.option('-n, --init', 'init new project');
commander_1.program.option("-c, --clean", "cleans build dirs");
commander_1.program.option('-b, --build', 'build mod');
commander_1.program.option('-d, --dist', 'pack mod');
commander_1.program.option("-i, --install <url>", 'install core');
commander_1.program.option('-r, --run', 'run mod');
commander_1.program.allowUnknownOption(true);
commander_1.program.parse(process.argv);
console.log("ModLoader64 SDK v3.0.0");
var Tools = /** @class */ (function () {
    function Tools() {
    }
    Tools.gulp = false;
    Tools.git = false;
    return Tools;
}());
var og = path_1.default.resolve(process.cwd());
var sdk = path_1.default.resolve(path_1.default.parse(process.execPath).dir);
if (fs_extra_1.default.existsSync(path_1.default.resolve(sdk, "node.exe"))) {
    // Probably a weird setup?
    sdk = path_1.default.resolve(__dirname, "..");
}
var options = commander_1.program.opts();
function checkGulp() {
    try {
        child_process_1.default.execSync("gulp -v", { stdio: 'pipe' });
        Tools.gulp = true;
        return true;
    }
    catch (err) {
    }
    return false;
}
function checkGit() {
    try {
        child_process_1.default.execSync("git --version", { stdio: 'pipe' });
        Tools.git = true;
        return true;
    }
    catch (err) {
    }
    return false;
}
function setupGulp() {
    if (fs_extra_1.default.existsSync(path_1.default.resolve(og, "gulpfile.ts"))) {
        console.log("gulp... ".concat(checkGulp()));
        (0, compiler_1.doBuildSingle)(path_1.default.resolve(og, "gulpfile.ts"));
    }
}
function makeSymlink(src, dest) {
    try {
        var p = path_1.default.parse(dest);
        if (!fs_extra_1.default.existsSync(p.dir)) {
            fs_extra_1.default.mkdirSync(p.dir);
        }
        fs_extra_1.default.symlinkSync(src, dest, 'junction');
    }
    catch (err) {
        console.log(err);
    }
}
try {
    if (!fs_extra_1.default.existsSync(path_1.default.resolve(sdk, "client"))) {
        console.log("Extracting client...");
        asar_1.default.extractAll(path_1.default.resolve(sdk, "client.asar"), path_1.default.resolve(sdk, "client"));
        if (!fs_extra_1.default.existsSync(path_1.default.resolve(sdk, "client/node_modules"))) {
            asar_1.default.extractAll(path_1.default.resolve(sdk, "client/node_modules.asar"), path_1.default.resolve(sdk, "client", "node_modules"));
        }
    }
}
catch (err) { }
function init(_dir) {
    if (!fs_extra_1.default.existsSync(path_1.default.resolve(_dir, "package.json"))) {
        var t = JSON.parse(JSON.stringify(template_1.template));
        t.name = path_1.default.parse(_dir).name;
        fs_extra_1.default.writeFileSync(path_1.default.resolve(_dir, "package.json"), JSON.stringify(t, null, 2));
    }
    var meta = JSON.parse(fs_extra_1.default.readFileSync(path_1.default.resolve(_dir, "package.json")).toString());
    if (!fs_extra_1.default.existsSync(path_1.default.resolve(_dir, "node_modules"))) {
        fs_extra_1.default.mkdirSync(path_1.default.resolve(_dir, "node_modules"));
    }
    console.log("Linking ModLoader64 API to project...");
    console.log("This might take a moment. Please be patient.");
    fs_extra_1.default.readdirSync(path_1.default.resolve(sdk, "client/node_modules")).forEach(function (dir) {
        var d = path_1.default.resolve(sdk, "client/node_modules", dir);
        var d1 = path_1.default.resolve(_dir, "node_modules", path_1.default.parse(d).base);
        if (!fs_extra_1.default.existsSync(d1)) {
            makeSymlink(d, d1);
        }
    });
    if (!fs_extra_1.default.existsSync(path_1.default.resolve(_dir, "src"))) {
        fs_extra_1.default.mkdirSync(path_1.default.resolve(_dir, "src"));
        fs_extra_1.default.mkdirSync(path_1.default.resolve(_dir, "src", meta.name));
        fs_extra_1.default.copyFileSync(path_1.default.resolve(_dir, "package.json"), path_1.default.resolve(_dir, "src", meta.name, "package.json"));
    }
    setupGulp();
}
function checkSymLinks() {
    var fail = false;
    var nm = path_1.default.resolve(og, "node_modules");
    fs_extra_1.default.readdirSync(nm).forEach(function (dir) {
        if (!fs_extra_1.default.existsSync(path_1.default.resolve(nm, dir))) {
            if (!fail)
                fail = true;
        }
    });
    if (fail) {
        console.log("API symlinks appear to be broken in this project. Attempting repair...");
        fs_extra_1.default.removeSync(nm);
        init(og);
    }
}
function build() {
    checkSymLinks();
    console.log("Building ".concat(og, "..."));
    setupGulp();
    if (Tools.gulp) {
        child_process_1.default.execSync("gulp", { stdio: "inherit" });
    }
    else {
        (0, compiler_1.doBuild)(og);
    }
    (0, compiler_1.doCopy)(og);
}
function clean() {
    if (fs_extra_1.default.existsSync(path_1.default.resolve(og, "build"))) {
        fs_extra_1.default.removeSync(path_1.default.resolve(og, "build"));
    }
    if (fs_extra_1.default.existsSync(path_1.default.resolve(og, "dist"))) {
        fs_extra_1.default.removeSync(path_1.default.resolve(og, "dist"));
    }
}
function dist() {
    var d = path_1.default.resolve(og, "dist");
    if (!fs_extra_1.default.existsSync(d)) {
        fs_extra_1.default.mkdirSync(d);
    }
    var b = path_1.default.resolve(og, "build");
    fs_extra_1.default.copySync(b, d);
    var folders = (0, getAllFiles_1.getAllFolders)(d, []);
    folders.forEach(function (folder) {
        var n = path_1.default.parse(folder).name;
        var zipFile = new adm_zip_1.default();
        zipFile.addLocalFolder(folder, path_1.default.parse(folder).name);
        zipFile.writeZip(path_1.default.resolve(d, "".concat(n, ".zip")));
        var pak = new PakFormat_1.Pak(path_1.default.resolve(d, "".concat(n, ".pak")));
        var files = (0, getAllFiles_1.getAllFiles)(folder, []);
        console.log("Total files: " + files.length);
        process.chdir(d);
        for (var i = 0; i < files.length; i++) {
            var r = path_1.default.join(".", path_1.default.relative(process.cwd(), files[i]));
            pak.save_file(r);
        }
        process.chdir(og);
        pak.update();
    });
}
function install() {
    console.log("git.... ".concat(checkGit()));
    var c = path_1.default.resolve(sdk, "_cores");
    if (!fs_extra_1.default.existsSync(c)) {
        fs_extra_1.default.mkdirSync(c);
    }
    var url = options.install.toString();
    if (!Tools.git) {
        console.error("You do not have git installed!");
        throw new Error("You do not have git installed!");
    }
    else {
        var name_1 = path_1.default.parse(url).name;
        var dir = path_1.default.resolve(c, name_1);
        if (!fs_extra_1.default.existsSync(dir)) {
            child_process_1.default.execSync("git clone --recurse-submodules ".concat(url, " ").concat(dir));
        }
        var meta = JSON.parse(fs_extra_1.default.readFileSync(path_1.default.resolve(dir, "package.json")).toString());
        if (meta.name !== name_1) {
            name_1 = meta.name;
        }
        console.log(dir);
        init(dir);
        (0, compiler_1.doBuild)(dir);
        (0, compiler_1.doCopy)(dir);
        var folders = (0, getAllFiles_1.getAllFolders)(path_1.default.resolve(dir, "build"), []);
        while (folders.length > 1) {
            folders.pop();
        }
        var folder = folders.pop();
        var client_core_folder = path_1.default.resolve(sdk, "client", "cores");
        if (!fs_extra_1.default.existsSync(client_core_folder)) {
            fs_extra_1.default.mkdirSync(client_core_folder);
        }
        makeSymlink(folder, path_1.default.resolve(client_core_folder, name_1));
        makeSymlink(folder, path_1.default.resolve(og, "node_modules", name_1));
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
//# sourceMappingURL=index.js.map