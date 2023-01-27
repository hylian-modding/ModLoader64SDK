include("./build_number.jl");

conda_meta = "package:
name: modloader64-sdk
version: 3.0.0

source:
fn: modloader64-sdk-win64.zip [win]
url: https://repo.modloader64.com/conda/modloader64-sdk-win64.zip [win]
fn: modloader64-sdk-linux.zip [linux]
url: https://repo.modloader64.com/conda/modloader64-sdk-linux.zip [linux]

build:
number: $build_number

about:
home: http://modloader64.com
license: GPL-3
summary: SDK for ModLoader64";

function writeCondaMetadata()
    open("./conda/meta.yaml", "w") do file
        write(file, conda_meta);
    end
end

function runCommand(command::String)
    if (Sys.iswindows())
        run(`cmd /c $command`);
    else
        run(`$command`);
    end
end

function hasTools()
    if (Sys.iswindows())
        return ispath("./modloader64.exe");
    else
        return ispath("./modloader64");
    end
end

function buildTool()
    runCommand("tsc");
    runCommand("pkg --compress GZip .");
end

function copyTool(tool::String)
    if (Sys.iswindows())
        cp("./tools/$tool/$tool-win.exe", "./$tool.exe", force=true);
    else
        cp("./tools/$tool/$tool-linux", "./$tool", force=true);
        runCommand("chmod +x ./$tool");
    end
end

function isDist()
    if (size(ARGS)[1] > 0)
        if (ARGS[1] == "dist")
            return true;
        end
    end
    return false;
end

function isUpdateCore()
    if (size(ARGS)[1] > 0)
        if (ARGS[1] == "core")
            return true;
        end
    end
    return false;
end

function updateCore()
    runCommand("yarn build");
end

# Preinstall
rm("./build", force=true, recursive=true);
mkdir("./build");
cp("./src", "./build", force=true);

# Tool check
if (!hasTools())
    println("Starting tool setup...");

    println("Building paker...");
    cd(buildTool, "./tools/paker");
    copyTool("paker");

    println("Building bintots...");
    cd(buildTool, "./tools/bintots");
    copyTool("bintots");

    println("Building linker...");
    cd(buildTool, "./tools/linker");
    copyTool("linker");
end

# Check core
if (isUpdateCore())
    cd(updateCore, "./ModLoader64")
    mv("./ModLoader64/windows.zip", "./src/windows.zip", force=true);
    mv("./ModLoader64/windows.md5", "./src/windows.md5", force=true);
    mv("./ModLoader64/linux.zip", "./src/linux.zip", force=true);
    mv("./ModLoader64/linux.md5", "./src/linux.md5", force=true);
end

# Build
println("Building SDK...");
runCommand("tsc");
println("Ignore all the pkg warnings. They're nonsense.");

runCommand("pkg --compress GZip .");

if (Sys.iswindows())
    cp("./modloader64-win.exe", "./modloader64.exe", force=true);
else
    cp("./modloader64-linux", "./modloader64", force=true);
end

println("Build complete.");

if (isDist())
    println("Starting dist...");
    rm("./dist", force=true, recursive=true);

    mkdir("./dist");
    mkdir("./dist/windows");
    mkdir("./dist/linux");

    mv("./modloader64-win.exe", "./dist/windows/modloader64.exe");
    mv("./modloader64-linux", "./dist/linux/modloader64");

    runCommand("ts-node ./dist.ts");
    println("Dist complete.");
end