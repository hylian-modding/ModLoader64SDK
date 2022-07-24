import fs from 'fs';
import path from 'path';
import { ISDKCompiler } from './compiler';

interface ISDKPlugin {
    init(og: string, sdk: string, basefunc: () => void): () => void;
    build(og: string, sdk: string, basefunc: () => void, compiler: ISDKCompiler): () => void;
    dist(og: string, sdk: string, basefunc: () => void): () => void;
}

export default class PluginManager {

    plugins: ISDKPlugin[] = [];

    constructor(sdk: string) {
        let pdir = path.resolve(sdk, "plugins");
        if (!fs.existsSync(pdir)) {
            fs.mkdirSync(pdir);
        }
        fs.readdirSync(pdir).forEach((f: string) => {
            let file = path.resolve(pdir, f);
            if (fs.existsSync(file) && path.parse(file).ext === ".asar") {
                console.log(`Loading plugin ${path.parse(file).base}...`);
                try {
                    let p = require(file);
                    let c = p["default"];
                    this.plugins.push(new c());
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }

}