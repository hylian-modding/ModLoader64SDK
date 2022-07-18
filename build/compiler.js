"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doCopy = exports.doBuildSingle = exports.doBuild = void 0;
var ts = __importStar(require("typescript"));
var getAllFiles_1 = require("./getAllFiles");
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
function compile(fileNames, options) {
    var program = ts.createProgram(fileNames, options);
    var emitResult = program.emit();
    var allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);
    allDiagnostics.forEach(function (diagnostic) {
        if (diagnostic.file) {
            var _a = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start), line = _a.line, character = _a.character;
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log("".concat(diagnostic.file.fileName, " (").concat(line + 1, ",").concat(character + 1, "): ").concat(message));
        }
        else {
            console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
    });
}
function getAllFilesNoModules(dir, files, ext) {
    (0, getAllFiles_1.getAllFiles)(dir, files, ext);
    var r = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].indexOf("node_modules") > -1) {
            r.push(files[i]);
        }
    }
    if (r.length > 0) {
        while (r.length > 0) {
            var rm = r.shift();
            var index = files.indexOf(rm);
            files.splice(index, 1);
        }
    }
    return files;
}
function doBuild(dir) {
    var meta = JSON.parse(fs_extra_1.default.readFileSync(path_1.default.resolve(dir, "package.json")).toString());
    var src = path_1.default.resolve(dir, "src");
    var build = path_1.default.resolve(dir, "build");
    if (!fs_extra_1.default.existsSync(build)) {
        fs_extra_1.default.mkdirSync(build);
    }
    var map = {};
    map["@".concat(meta.name, "/*")] = [path_1.default.resolve(src, meta.name) + "/*"];
    compile(getAllFilesNoModules(src, [], ".ts"), {
        noEmitOnError: true,
        noImplicitAny: false,
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
        outDir: build,
        rootDir: src,
        esModuleInterop: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        paths: map,
    });
    var core = path_1.default.resolve(dir, "cores");
    if (fs_extra_1.default.existsSync(core)) {
        var map_1 = {};
        map_1["@".concat(meta.name, "/*")] = [path_1.default.resolve(src, meta.name) + "/*"];
        compile(getAllFilesNoModules(core, [], ".ts"), {
            noEmitOnError: true,
            noImplicitAny: false,
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.CommonJS,
            experimentalDecorators: true,
            outDir: build,
            rootDir: core,
            esModuleInterop: true,
            declaration: true,
            declarationMap: true,
            sourceMap: true,
            paths: map_1
        });
    }
}
exports.doBuild = doBuild;
function doBuildSingle(f) {
    var src = path_1.default.resolve(path_1.default.parse(f).dir);
    var build = path_1.default.resolve(path_1.default.parse(f).dir);
    compile([f], {
        noEmitOnError: true,
        noImplicitAny: false,
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
        outDir: build,
        rootDir: src,
        esModuleInterop: true
    });
}
exports.doBuildSingle = doBuildSingle;
function doCopy(dir) {
    var src = path_1.default.resolve(dir, "src");
    var build = path_1.default.resolve(dir, "build");
    fs_extra_1.default.copySync(src, build, { recursive: true });
    var core = path_1.default.resolve(dir, "cores");
    if (fs_extra_1.default.existsSync(core)) {
        fs_extra_1.default.copySync(core, build, { recursive: true });
    }
}
exports.doCopy = doCopy;
//# sourceMappingURL=compiler.js.map