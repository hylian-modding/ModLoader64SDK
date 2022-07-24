import fs from 'fs';

console.log("Ignore all the pkg warnings. They're nonsense.");

if (!fs.existsSync("./dist")) {
    fs.mkdirSync("./dist");
}
if (!fs.existsSync("./dist/windows")) {
    fs.mkdirSync("./dist/windows");
}
if (!fs.existsSync("./dist/linux")) {
    fs.mkdirSync("./dist/linux");
}