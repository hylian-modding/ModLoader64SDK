import fs from 'fs';
import path from 'path';
import child_process from 'child_process';

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

export default class JuliaPlugin implements ISDKPlugin {

    init(og: string, sdk: string, basefunc: () => void): () => void {
        return basefunc;
    }

    build(og: string, sdk: string, basefunc: () => void, compiler: ISDKCompiler): () => void {
        let nf = ()=>{
            basefunc();
            if (fs.existsSync(path.resolve(og, "build.jl"))){
                console.log(`Executing julia file: ${path.resolve(og, "build.jl")}`);
                process.chdir(og);
                console.log(child_process.execSync("julia ./build.jl").toString());
                process.chdir(sdk);
            }
        }
        return nf;
    }

    dist(og: string, sdk: string, basefunc: () => void): () => void {
        return basefunc;
    }

}