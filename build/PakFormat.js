"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pak = exports.PakFile = exports.PakFooter = exports.PakHeader = exports.PakFileEntry = void 0;
var fs_1 = __importDefault(require("fs"));
var zlib_1 = __importDefault(require("zlib"));
var path_1 = __importDefault(require("path"));
var fx = require('mkdir-recursive');
var crypto_1 = __importDefault(require("crypto"));
var os_1 = __importDefault(require("os"));
function slash(path) {
    var isExtendedLengthPath = /^\\\\\?\\/.test(path);
    var hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex
    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }
    return path.replace(/\\/g, '/');
}
var lzmaWrapper = /** @class */ (function () {
    function lzmaWrapper() {
        this.lzma = require("lzma");
    }
    lzmaWrapper.prototype.compress = function (buf) {
        return Buffer.from(this.lzma.compress(buf));
    };
    lzmaWrapper.prototype.decompress = function (buf) {
        return Buffer.from(this.lzma.decompress(buf));
    };
    return lzmaWrapper;
}());
var lzmaInstance = new lzmaWrapper();
var PakFileEntry = /** @class */ (function () {
    function PakFileEntry(filename, type, size, pstart, pend) {
        this.filename = filename;
        this.type = type;
        this.size = size;
        this.pstart = pstart;
        this.pend = pend;
    }
    return PakFileEntry;
}());
exports.PakFileEntry = PakFileEntry;
var PakHeader = /** @class */ (function () {
    function PakHeader() {
        this.ml = 'ModLoader64';
        this.version = 0x3;
        this.files = [];
    }
    return PakHeader;
}());
exports.PakHeader = PakHeader;
var PakFooter = /** @class */ (function () {
    function PakFooter() {
    }
    PakFooter.prototype.generateHash = function (buf) {
        this._hash = crypto_1.default
            .createHash('sha512')
            .update(buf)
            .digest('hex');
        var hash = Buffer.from(this._hash, 'hex');
        var tag = Buffer.from(os_1.default.userInfo().username +
            '@' +
            os_1.default.hostname() +
            ' ' +
            new Date().toISOString());
        var tag_size = tag.byteLength;
        while (tag_size % 0x10 !== 0) {
            tag_size++;
        }
        var foot1 = Buffer.alloc(0x10 + tag_size);
        foot1.write('MLPublish.......');
        tag.copy(foot1, 0x10);
        var f2_size = 0x10 + hash.byteLength;
        var foot2 = Buffer.alloc(f2_size);
        foot2.write('MLVerify........');
        hash.copy(foot2, 0x10);
        this.footer = Buffer.alloc(foot1.byteLength + foot2.byteLength);
        foot1.copy(this.footer);
        foot2.copy(this.footer, foot1.byteLength);
    };
    return PakFooter;
}());
exports.PakFooter = PakFooter;
var PakFile = /** @class */ (function () {
    function PakFile() {
        this.header = new PakHeader();
        this.footer = new PakFooter();
    }
    PakFile.prototype.load = function (file) {
        this.header.files.length = 0;
        this.data = fs_1.default.readFileSync(file);
        this._load();
    };
    PakFile.prototype._load = function () {
        var hlength = this.data.readUInt32BE(0x0b);
        var table = this.data.slice(0x10, 0x10 + hlength * 0x10 + 0x1);
        for (var i = 0; i < hlength; i++) {
            var type = table.slice(i * 0x10 + 0x0, i * 0x10 + 0x4).toString();
            var filename_offset = table.readUInt32BE(i * 0x10 + 0x4);
            var pstart = table.readUInt32BE(i * 0x10 + 0x8);
            var pend = table.readUInt32BE(i * 0x10 + 0xc);
            var filename_b = '';
            var current_byte = 0;
            var current_byte_index = 0;
            while (current_byte !== 0xff) {
                current_byte = this.data.readUInt8(filename_offset + current_byte_index);
                var char_b = Buffer.alloc(0x1);
                char_b.writeUInt8(current_byte, 0x0);
                filename_b += char_b.toString();
                current_byte_index++;
            }
            filename_b = filename_b.slice(0, -1);
            var head = new PakFileEntry(filename_b, type, 0, pstart, pend);
            head.data = this.data.slice(pstart, pend);
            head.size = head.data.byteLength;
            this.header.files.push(head);
        }
        var find_footer = this.data.indexOf(Buffer.from('MLPublish.......'));
        if (find_footer > -1) {
            this.footer.footer = Buffer.alloc(this.data.byteLength - find_footer);
            this.data.copy(this.footer.footer, 0, find_footer);
        }
        var find_hash = this.data.indexOf(Buffer.from('MLVerify........'));
        if (find_hash > -1) {
            var _temp = Buffer.alloc(this.data.byteLength - (find_hash + 0x10));
            this.data.copy(_temp, 0, find_hash + 0x10);
            this.footer._hash = _temp.toString('hex');
        }
    };
    PakFile.prototype.update = function () {
        var totalSize = 0;
        var headerSize = 0;
        totalSize += 0x10;
        headerSize += 0x10;
        for (var i = 0; i < this.header.files.length; i++) {
            totalSize += 0x10;
            headerSize += 0x10;
            totalSize += this.header.files[i].size;
            totalSize += Buffer.from(this.header.files[i].filename).byteLength;
            totalSize += 0x1;
        }
        // Padding so the footer is byte alligned.
        while (totalSize % 0x10 !== 0) {
            totalSize++;
        }
        this.data = Buffer.alloc(totalSize);
        this.data.write(this.header.ml);
        this.data.writeUInt32BE(this.header.files.length, 0x0b);
        this.data.writeUInt8(this.header.version, 0x0f);
        var current = headerSize;
        for (var i = 0; i < this.header.files.length; i++) {
            var fnb = Buffer.from(this.header.files[i].filename);
            fnb.copy(this.data, current, 0, fnb.byteLength);
            this.header.files[i].filename_offset = current;
            current += fnb.byteLength;
            this.data.writeUInt8(0xff, current);
            current += 0x1;
        }
        for (var i = 0; i < this.header.files.length; i++) {
            var size = this.header.files[i].size;
            this.data.write(this.header.files[i].type, 0x10 + i * 0x10 + 0x0);
            this.data.writeUInt32BE(this.header.files[i].filename_offset, 0x10 + i * 0x10 + 0x4);
            this.data.writeUInt32BE(current, 0x10 + i * 0x10 + 0x8);
            this.header.files[i].data.copy(this.data, current);
            current += size;
            this.data.writeUInt32BE(current, 0x10 + i * 0x10 + 0xc);
        }
        this.footer.generateHash(this.data);
        var nSize = this.data.byteLength + this.footer.footer.byteLength;
        var f = Buffer.alloc(nSize);
        this.data.copy(f);
        this.footer.footer.copy(f, this.data.byteLength);
        this.data = f;
    };
    PakFile.prototype.overwrite = function (index, obj, compressed, filename) {
        if (compressed === void 0) { compressed = { enabled: true, algo: "DEFL" }; }
        if (filename === void 0) { filename = 'obj.json'; }
        var type = 'UNCO';
        var data;
        if (Buffer.isBuffer(obj)) {
            data = obj;
        }
        else {
            var json = JSON.stringify(obj);
            data = Buffer.from(json);
        }
        if (compressed.enabled) {
            switch (compressed.algo) {
                case "DEFL":
                    data = zlib_1.default.deflateSync(data);
                    type = 'DEFL';
                    break;
                case "LZMA":
                    data = lzmaInstance.compress(data);
                    type = "LZMA";
                    break;
            }
        }
        var entry = new PakFileEntry(slash(filename), type, data.byteLength, 0xffffffff, 0xffffffff);
        entry.data = data;
        this.header.files[index] = entry;
        return this.header.files.indexOf(entry);
    };
    PakFile.prototype.insert = function (obj, compressed, filename) {
        if (compressed === void 0) { compressed = { enabled: true, algo: "DEFL" }; }
        if (filename === void 0) { filename = 'obj.json'; }
        var type = 'UNCO';
        var data;
        if (Buffer.isBuffer(obj)) {
            data = obj;
        }
        else {
            var json = JSON.stringify(obj);
            data = Buffer.from(json);
        }
        if (compressed.enabled) {
            switch (compressed.algo) {
                case "DEFL":
                    data = zlib_1.default.deflateSync(data);
                    type = 'DEFL';
                    break;
                case "LZMA":
                    data = lzmaInstance.compress(data);
                    type = "LZMA";
                    break;
            }
        }
        var entry = new PakFileEntry(slash(filename), type, data.byteLength, 0xffffffff, 0xffffffff);
        entry.data = data;
        this.header.files.push(entry);
        return this.header.files.indexOf(entry);
    };
    PakFile.prototype.insertFile = function (file, compressed) {
        if (compressed === void 0) { compressed = { enabled: true, algo: "DEFL" }; }
        return this.insert(fs_1.default.readFileSync(file), compressed, file);
    };
    PakFile.prototype.retrieve = function (index) {
        var d = this.header.files[index].data;
        if (this.header.files[index].type === 'DEFL') {
            d = zlib_1.default.inflateSync(this.header.files[index].data);
        }
        else if (this.header.files[index].type === 'LZMA') {
            d = lzmaInstance.decompress(this.header.files[index].data);
        }
        return d;
    };
    PakFile.prototype.verify = function () {
        try {
            var find_footer = this.data.indexOf(Buffer.from('MLPublish.......'));
            var _hash = crypto_1.default
                .createHash('sha512')
                .update(this.data.slice(0, find_footer))
                .digest('hex');
            return this.footer._hash === _hash;
        }
        catch (err) {
        }
        return false;
    };
    return PakFile;
}());
exports.PakFile = PakFile;
var Pak = /** @class */ (function () {
    function Pak(filename, buf) {
        this.pak = new PakFile();
        this.fileName = filename;
        if (buf !== undefined) {
            this.pak.data = buf;
            this.pak._load();
        }
        else {
            if (fs_1.default.existsSync(this.fileName)) {
                this.pak.load(this.fileName);
            }
        }
    }
    Pak.prototype.overwriteFileAtIndex = function (index, obj, compressed) {
        if (compressed === void 0) { compressed = { enabled: true, algo: "DEFL" }; }
        var i = this.pak.overwrite(index, obj, compressed);
        return i;
    };
    Pak.prototype.save = function (obj, compressed) {
        if (compressed === void 0) { compressed = { enabled: true, algo: "DEFL" }; }
        var index = this.pak.insert(obj, compressed);
        return index;
    };
    Pak.prototype.save_file = function (file, compressed) {
        if (compressed === void 0) { compressed = { enabled: true, algo: "DEFL" }; }
        var index = this.pak.insertFile(file, compressed);
        return index;
    };
    Pak.prototype.update = function () {
        this.pak.update();
        fs_1.default.writeFileSync(this.fileName, this.pak.data);
    };
    Pak.prototype.load = function (index) {
        if (index === void 0) { index = 0; }
        return this.pak.retrieve(index);
    };
    Pak.prototype.extractAll = function (target) {
        for (var i = 0; i < this.pak.header.files.length; i++) {
            var data = this.load(i);
            var filename = this.pak.header.files[i].filename;
            var dir = path_1.default.parse(path_1.default.resolve(path_1.default.join(target, filename))).dir;
            fx.mkdirSync(dir);
            fs_1.default.writeFileSync(path_1.default.resolve(path_1.default.join(target, filename)), data);
        }
    };
    Pak.prototype.verify = function () {
        return this.pak.verify();
    };
    return Pak;
}());
exports.Pak = Pak;
//# sourceMappingURL=PakFormat.js.map