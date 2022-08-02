import * as ts from "typescript";
import { getAllFiles } from "./getAllFiles";
import fs from 'fs-extra';
import path from 'path';


function compile(fileNames: string[], options: ts.CompilerOptions): void {
    let program = ts.createProgram(fileNames, options);
    let emitResult = program.emit();

    let allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
    });
}

function getAllFilesNoModules(dir: string, files: Array<string>, ext: string) {
    getAllFiles(dir, files, ext);
    let r: string[] = [];
    for (let i = 0; i < files.length; i++) {
        if (files[i].indexOf("node_modules") > -1) {
            r.push(files[i]);
        }
    }
    if (r.length > 0) {
        while (r.length > 0) {
            let rm = r.shift()!;
            let index = files.indexOf(rm);
            files.splice(index, 1);
        }
    }
    return files;
}

export function doBuild(dir: string) {
    let meta: Record<string, string> = JSON.parse(fs.readFileSync(path.resolve(dir, "package.json")).toString());
    let src = path.resolve(dir, "src");
    let build = path.resolve(dir, "build");
    if (!fs.existsSync(build)) {
        fs.mkdirSync(build);
    }
    let map: Record<string, string[]> = {};
    compile(getAllFilesNoModules(src, [], ".ts"), {
        noEmitOnError: true,
        noImplicitAny: false,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
        outDir: build,
        rootDir: src,
        esModuleInterop: true,
        paths: map,
    });
}

export function doBuildSingle(f: string) {
    let src = path.resolve(path.parse(f).dir);
    let build = path.resolve(path.parse(f).dir);
    compile([f], {
        noEmitOnError: true,
        noImplicitAny: false,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
        outDir: build,
        rootDir: src,
        esModuleInterop: true
    });
    return path.resolve(path.parse(f).dir, `${path.parse(f).name}.js`);
}

export function doCopy(dir: string) {
    let src = path.resolve(dir, "src");
    let build = path.resolve(dir, "build");
    fs.copySync(src, build, { recursive: true });
    let core = path.resolve(dir, "cores");
    if (fs.existsSync(core)) {
        fs.copySync(core, build, { recursive: true });
    }
}