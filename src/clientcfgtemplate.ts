export const clientcfgtemplate: any = {
    "ModLoader64": {
        "rom": "Legend of Zelda, The - Ocarina of Time (U) (V1.0) [!].z64",
        "patch": "",
        "isServer": true,
        "isClient": true,
        "supportedConsoles": [
            "Mupen64Plus"
        ],
        "selectedConsole": "Mupen64Plus",
        "coreOverride": "",
        "disableVIUpdates": false,
        "enableDebugger": false
    },
    "NetworkEngine.Client": {
        "isSinglePlayer": true,
        "forceServerOverride": false,
        "ip": "127.0.0.1",
        "port": 8082,
        "lobby": "meeting-shimmering-84",
        "nickname": "Player",
        "password": "",
        "forceTCPMode": false
    },
    "NetworkEngine.Server": {
        "port": 8082,
        "udpPort": 8082,
        "patchSizeLimitMB": 10
    },
    "Mupen64Plus": {
        "rsp": "mupen64plus-rsp-hle",
        "video": "mupen64plus-video-gliden64",
        "audio": "mupen64plus-audio-sdl",
        "input": "mupen64plus-input-sdl"
    },
    "N64TexturePacks": {
        "texturePackStatus": {}
    }
};

export const clientcfgtemplate_nonhost: any = {
    "ModLoader64": {
        "rom": "Legend of Zelda, The - Ocarina of Time (U) (V1.0) [!].z64",
        "patch": "",
        "isServer": false,
        "isClient": true,
        "supportedConsoles": [
            "Mupen64Plus"
        ],
        "selectedConsole": "Mupen64Plus",
        "coreOverride": "",
        "disableVIUpdates": false,
        "enableDebugger": false
    },
    "NetworkEngine.Client": {
        "isSinglePlayer": false,
        "forceServerOverride": true,
        "ip": "127.0.0.1",
        "port": 8082,
        "lobby": "meeting-shimmering-84",
        "nickname": "Player",
        "password": "",
        "forceTCPMode": false
    },
    "NetworkEngine.Server": {
        "port": 8082,
        "udpPort": 8082,
        "patchSizeLimitMB": 10
    },
    "Mupen64Plus": {
        "rsp": "mupen64plus-rsp-hle",
        "video": "mupen64plus-video-gliden64",
        "audio": "mupen64plus-audio-sdl",
        "input": "mupen64plus-input-sdl"
    },
    "N64TexturePacks": {
        "texturePackStatus": {}
    }
};