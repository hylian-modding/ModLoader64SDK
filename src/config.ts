export interface ISDKConfig{
    rom_directory: string;
}

export class SDKConfig implements ISDKConfig{

    rom_directory: string;
    
    constructor(rom_directory: string){
        this.rom_directory = rom_directory;
    }
}