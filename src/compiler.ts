import * as ts from "typescript";
import { getAllFiles } from "./getAllFiles";
import fs from 'fs-extra';
import path from 'path';
import { slash } from "./PakFormat";
import preprocessor from "./preprocessor";

function compile(fileNames: string[], options: ts.CompilerOptions, preproc: boolean = true, preproc_flags: string[] = []): void {

    if (preproc) {
        try {
            let files = getAllFiles(options.outDir!, [], ".ts");
            files.forEach((file: string) => {
                preprocessor.process(file, preproc_flags);
            });
        } catch (err: any) {
            console.error(err);
        }
    }

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
        } else if (files[i].indexOf(".asar") > -1) {
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

export function doBuild(dir: string, preproc_flags: string[] = []) {
    let meta: Record<string, string> = JSON.parse(fs.readFileSync(path.resolve(dir, "package.json")).toString());
    let src = path.resolve(dir, "build");
    let build = path.resolve(dir, "build");
    if (!fs.existsSync(build)) {
        fs.mkdirSync(build);
    }
    let map: Record<string, string[]> = {};
    map[`@${meta.name}/*`] = ["./" + slash(path.relative(dir, path.resolve(src, meta.name))) + "/*"];
    compile(getAllFilesNoModules(src, [], ".ts"), {
        noEmitOnError: true,
        noImplicitAny: false,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
        outDir: build,
        rootDir: src,
        esModuleInterop: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        paths: map,
    }, true, preproc_flags);
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
    }, false);
    return path.resolve(path.parse(f).dir, `${path.parse(f).name}.js`);
}

export function doCopy(dir: string) {
    let src = path.resolve(dir, "src");
    let build = path.resolve(dir, "build");
    fs.copySync(src, build, { recursive: true, filter: (src: string, dest: string) => { return src.indexOf(".asar") === -1 } });
    let core = path.resolve(dir, "cores");
    if (fs.existsSync(core)) {
        fs.copySync(core, build, { recursive: true });
    }
}

export class SDKCompiler {
    doBuild(dir: string) {
        doBuild(dir);
    }

    doBuildSingle(f: string): string {
        return doBuildSingle(f);
    }

    doCopy(dir: string) {
        doCopy(dir);
    }
}

export interface ISDKCompiler {
    doBuild(dir: string);
    doBuildSingle(f: string): string;
    doCopy(dir: string);
}