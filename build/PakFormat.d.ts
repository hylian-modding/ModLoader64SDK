/// <reference types="node" />
export interface IPakFileEntry {
    type: string;
    size: number;
    pstart: number;
    pend: number;
}
export declare class PakFileEntry implements IPakFileEntry {
    filename: string;
    type: string;
    size: number;
    filename_offset: number;
    pstart: number;
    pend: number;
    data: Buffer;
    constructor(filename: string, type: string, size: number, pstart: number, pend: number);
}
export interface IPakHeader {
    ml: string;
    version: number;
    files: PakFileEntry[];
}
export interface IPakFooter {
    footer: Buffer;
}
export declare class PakHeader implements IPakHeader {
    ml: string;
    version: number;
    files: PakFileEntry[];
}
export declare class PakFooter implements IPakFooter {
    footer: Buffer;
    _hash: string;
    generateHash(buf: Buffer): void;
}
export interface IPakFile {
    header: PakHeader;
    data: Buffer;
    load(file: string): void;
    insert(obj: any, compressed?: IPakFileCompressionOptions): number;
    insertFile(file: string, compressed?: IPakFileCompressionOptions): number;
    retrieve(index: number): Buffer;
    footer: PakFooter;
    verify(): boolean;
}
export interface IPakFileCompressionOptions {
    enabled: true;
    algo: string;
}
export declare class PakFile implements IPakFile {
    header: PakHeader;
    data: Buffer;
    footer: PakFooter;
    load(file: string): void;
    _load(): void;
    update(): void;
    overwrite(index: number, obj: any, compressed?: IPakFileCompressionOptions, filename?: string): number;
    insert(obj: any, compressed?: IPakFileCompressionOptions, filename?: string): number;
    insertFile(file: string, compressed?: IPakFileCompressionOptions): number;
    retrieve(index: number): Buffer;
    verify(): boolean;
}
export interface IPak {
    fileName: string;
    save(obj: any, compressed?: IPakFileCompressionOptions): number;
    save_file(file: string, compressed?: IPakFileCompressionOptions): number;
    load(index: number): Buffer;
    extractAll(target: string): void;
    update(): void;
    overwriteFileAtIndex(index: number, obj: any, compressed?: IPakFileCompressionOptions): number;
    verify(): boolean;
}
export declare class Pak implements IPak {
    fileName: string;
    pak: PakFile;
    constructor(filename: string, buf?: Buffer);
    overwriteFileAtIndex(index: number, obj: any, compressed?: IPakFileCompressionOptions): number;
    save(obj: any, compressed?: IPakFileCompressionOptions): number;
    save_file(file: string, compressed?: IPakFileCompressionOptions): number;
    update(): void;
    load(index?: number): Buffer;
    extractAll(target: string): void;
    verify(): boolean;
}
//# sourceMappingURL=PakFormat.d.ts.map