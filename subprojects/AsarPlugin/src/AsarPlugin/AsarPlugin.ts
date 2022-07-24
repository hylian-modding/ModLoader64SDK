import asar from 'asar';
import fs from 'fs';
import path from 'path';

interface ISDKCompiler {
    doBuild(dir: string);
    doBuildSingle(f: string): string;
    doCopy(dir: string);
}

interface ISDKPlugin {
    init(og: string, sdk: string, basefunc: () => void): () => void;
    build(og: string, sdk: string, basefunc: () => void, compiler: ISDKCompiler): () => void;
    dist(og: string, sdk: string, basefunc: () => void): () => void;
}

export default class AsarPlugin implements ISDKPlugin {

    init(og: string, sdk: string, basefunc: () => void): () => void {
        return basefunc;
    }

    build(og: string, sdk: string, basefunc: () => void, compiler: ISDKCompiler): () => void {
        return basefunc;
    }

    dist(og: string, sdk: string, basefunc: () => void): () => void {
        fs.readdirSync(path.resolve(og, "build")).forEach((f: string) => {
            let dir = path.resolve(og, "build", f);
            if (fs.lstatSync(dir).isDirectory()) {
                asar.createPackage(dir, path.resolve(og, "dist", `${path.parse(dir).name}.asar`));
            }
        });
        return basefunc;
    }

}