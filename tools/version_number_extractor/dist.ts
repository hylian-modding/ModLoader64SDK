import AdmZip from 'adm-zip';

let condazip = new AdmZip();
condazip.addLocalFolder("./dist");
condazip.writeZip("./dist/version_number_extractor-conda.zip");

let winzip = new AdmZip();
winzip.addLocalFolder("./dist/windows");
winzip.writeZip("./dist/windows/version_number_extractor-win64.zip");

let nixzip = new AdmZip();
nixzip.addLocalFolder("./dist/linux");
nixzip.writeZip("./dist/linux/version_number_extractor-linux.zip");