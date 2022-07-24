import AdmZip from 'adm-zip';

let winzip = new AdmZip();
winzip.addLocalFolder("./dist/windows");
winzip.writeZip("./dist/windows/modloader64-sdk-win64.zip");

let nixzip = new AdmZip();
nixzip.addLocalFolder("./dist/linux");
nixzip.writeZip("./dist/linux/modloader64-sdk-linux.zip");
