import path from 'path';

let og: string = path.resolve(process.cwd());

require(path.resolve(og, "src/index.js"));