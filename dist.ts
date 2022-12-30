import AdmZip from 'adm-zip';
import fs from 'fs';

let noarch_zip = new AdmZip();
noarch_zip.addLocalFolder("./dist");
fs.writeFileSync("./dist/modloader64-sdk.zip", noarch_zip.toBuffer());

let winzip = new AdmZip();
winzip.addLocalFolder("./dist/windows");
winzip.writeZip("./dist/windows/modloader64-sdk-win64.zip");

let nixzip = new AdmZip();
nixzip.addLocalFolder("./dist/linux");
nixzip.writeZip("./dist/linux/modloader64-sdk-linux.zip");