import child_process from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ISDKCompiler {
    doBuild(dir: string);
    doBuildSingle(f: string): string;
    doCopy(dir: string);
}

interface ISDKPlugin {
    init(og: string, sdk: string, basefunc: () => void): () => void;
    build(og: string, sdk: string, basefunc: () => void, compiler: ISDKCompiler): () => void;
    dist(og: string, sdk: string, basefunc: () => void): () => void;
}

export default class GulpPlugin implements ISDKPlugin {

    init(og: string, sdk: string, basefunc: () => void): () => void {
        return basefunc;
    }

    build(og: string, sdk: string, basefunc: () => void, compiler: ISDKCompiler): () => void {
        if (fs.existsSync(path.resolve(og, "gulpfile.ts"))) {
            compiler.doBuildSingle(path.resolve(og, "gulpfile.ts"));
            child_process.execSync("npx gulp", { stdio: 'inherit' });
            compiler.doCopy(og);
            return () => { };
        }
        return basefunc;
    }

    dist(og: string, sdk: string, basefunc: () => void): () => void {
        return basefunc;
    }


}