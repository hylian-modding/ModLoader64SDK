# ModLoader64SDK
This is the newest version of the ML64 SDK.

Benefits of this version over the original:
* Single executable.
* No external dependencies
* Clean updating, just replace the executable.

# Usage
Download the SDK from the releases page. Within the zip is the main executable and an updater to keep yourself up to date.

Once you've extracted the SDK you can put it on your system path. For windows users please see [this](https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/) for how. Alternatively simply keep the SDK executables in the folder you're going to be working in.

Running the modloader64 executable will give you the following options
```
Usage: index [options]

Options:
  -n, --init           init new project
  -c, --clean          cleans build dirs
  -b, --build          build mod
  -d, --dist           pack mod
  -i, --install <url>  install core
  -r, --run <num>      run mod
  -h, --help           display help for command
  ```

  In most cases you'll want to ``-n`` a new project, do some work, then ``-b`` to build it. ``-r 1`` will open the game with your mod loaded. Change the 1 to any number to open that many connected clients. Once you're done ``-d`` will package your mod up for sending it to others.

  # Building
  To build the SDK yourself clone this repository with the recursive flag. From here you can use the provided ``dockerfile`` to build it with docker or build it manually.

Manual building:
1. npm install -g yarn
2. npm install -g pkg
3. npm install -g ts-node
4. npm install -g asar
5. yarn
6. yarn fullbuild