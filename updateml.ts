import child_process from 'child_process';
import fs from 'fs';

let og = process.cwd();
process.chdir("./ModLoader64");
child_process.execSync("yarn");
process.chdir("./API");
console.log(child_process.execSync("modloader64 -cb").toString());
process.chdir("../");
console.log(child_process.execSync("modloader64 -cb").toString());
process.chdir(og);

fs.copyFileSync("./ModLoader64/windows.zip", "./src/windows.zip");
fs.unlinkSync("./ModLoader64/windows.zip");
fs.copyFileSync("./ModLoader64/windows.md5", "./src/windows.md5");
fs.unlinkSync("./ModLoader64/windows.md5");

fs.copyFileSync("./ModLoader64/linux.zip", "./src/linux.zip");
fs.unlinkSync("./ModLoader64/linux.zip");
fs.copyFileSync("./ModLoader64/linux.md5", "./src/linux.md5");
fs.unlinkSync("./ModLoader64/linux.md5");