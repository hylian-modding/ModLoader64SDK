"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFolders = exports.getAllFiles = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
function getAllFiles(dirPath, arrayOfFiles, ext) {
    if (ext === void 0) { ext = "*"; }
    var files = fs_1.default.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs_1.default.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles, ext);
        }
        else {
            if (path_1.default.parse(file).ext === ext || ext === "*") {
                arrayOfFiles.push(path_1.default.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}
exports.getAllFiles = getAllFiles;
function getAllFolders(dirPath, arrayOfFolders) {
    var files = fs_1.default.readdirSync(dirPath);
    arrayOfFolders = arrayOfFolders || [];
    files.forEach(function (file) {
        if (fs_1.default.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFolders.push(path_1.default.join(dirPath, "/", file));
        }
    });
    return arrayOfFolders;
}
exports.getAllFolders = getAllFolders;
//# sourceMappingURL=getAllFiles.js.map