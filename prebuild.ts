import fs from 'fs-extra';

console.log("Ignore all the pkg warnings. They're nonsense.");

if (fs.existsSync("./dist")){
    fs.removeSync("./dist");
}

if (!fs.existsSync("./dist")) {
    fs.mkdirSync("./dist");
}
if (!fs.existsSync("./dist/windows")) {
    fs.mkdirSync("./dist/windows");
}
if (!fs.existsSync("./dist/linux")) {
    fs.mkdirSync("./dist/linux");
}

if (fs.existsSync("./build")){
    fs.removeSync("./build");
}
fs.mkdirSync("./build");
fs.copySync("./src", "./build");