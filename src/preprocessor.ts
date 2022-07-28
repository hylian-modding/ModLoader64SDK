var uprocess = require("uprocess");
import fs from 'fs';

export default class preprocessor{   

    static process(file: string){
        var processed = uprocess.processFile(file);
        fs.writeFileSync(file, processed);
    }
}
