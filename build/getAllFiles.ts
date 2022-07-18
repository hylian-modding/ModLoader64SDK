import fs from 'fs';
import path from 'path';

export function getAllFiles(dirPath: string, arrayOfFiles: Array<string>, ext: string = "*") {
    let files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles, ext);
        }
        else {
            if (path.parse(file).ext === ext || ext === "*") {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

export function getAllFolders(dirPath: string, arrayOfFolders: Array<string>) {
    let files = fs.readdirSync(dirPath);

    arrayOfFolders = arrayOfFolders || [];

    files.forEach((file) => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFolders.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFolders;
}