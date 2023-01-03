import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

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
        return () => {
            basefunc();
            setTimeout(() => {
                let c = new AdmZip();
                let name: string = "";
                fs.readdirSync(path.resolve(og, "dist")).forEach((f: string) => {
                    let pak = path.resolve(og, "dist", f);
                    console.log(`${pak} | ${fs.lstatSync(pak).isDirectory()}`);
                    if (!fs.lstatSync(pak).isDirectory()) {
                        if (path.parse(pak).ext === ".pak") {
                            console.log("Found pak");
                            name = path.parse(pak).name;
                            c.addFile(`${name}/${path.parse(pak).base}`, fs.readFileSync(pak));
                            c.addFile("dummy", Buffer.from("dummy"));
                            console.log("Writing source zip for conda-build...");
                            console.log(path.resolve(og, "dist", `${name}_conda.zip`));
                            fs.writeFileSync(path.resolve(og, "dist", `${name}_conda.zip`), c.toBuffer());
                        }else if (path.parse(pak).ext === ".zip"){
                            let temp = fs.readFileSync(pak);
                            let temp_z = new AdmZip(temp);
                            temp_z.addFile("dummy", Buffer.from("dummy"));
                            fs.writeFileSync(pak, temp_z.toBuffer());
                        }
                    } else {
                        if (pak.indexOf(".asar") > -1) {
                            console.log("Found asar");
                            name = path.parse(pak).name;
                            let target = `${path.resolve(path.parse(pak).dir, name)}.asa_r`;
                            fs.renameSync(pak, target);
                            c.addFile(`${name}/${path.parse(pak).base}`, fs.readFileSync(target));
                            c.addFile("dummy", Buffer.from("dummy"));
                            console.log("Writing source zip for conda-build...");
                            console.log(path.resolve(og, "dist", `${name}_conda.zip`));
                            fs.writeFileSync(path.resolve(og, "dist", `${name}_conda.zip`), c.toBuffer());
                        }
                    }
                });
            }, 5000);
        }
    };
}