var uprocess = require("uprocess");
import fs from 'fs';

export default class preprocessor {

    static process(file: string, preproc_flags: string[] = []) {
        let p: any = {};
        for (let i = 0; i < preproc_flags.length; i++) {
            let s = preproc_flags[i].split(":");
            p[s[0].trim()] = s[1].trim();
        }
        var processed = uprocess.processFile(file, p);
        fs.writeFileSync(file, processed);
    }
}
