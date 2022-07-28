#!/usr/bin/env node

import { program } from 'commander';
import { Gui, ImGui } from 'ml64tk';
import path from 'path';
import { Application } from './Application';
import fs from 'fs';
import child_process, { ChildProcess } from 'child_process';
import { EventEmitter } from 'stream';
import { template } from './template';

program.parse(process.argv);

let og: string = path.resolve(process.cwd());
let sdk: string = path.resolve(path.parse(process.execPath).dir);

const bus: EventEmitter = new EventEmitter();

class Project {
    dir: string;
    meta: any;
    clean: ImGui.boolRef = [false];
    dist: ImGui.boolRef = [false];
    child: ChildProcess | undefined;
    open: ImGui.boolRef = [true];
    num: ImGui.numberRef = [1];

    constructor(dir: string, meta: any) {
        this.dir = dir;
        this.meta = meta;
    }

    draw() {
        if (this.open[0]) {
            if (ImGui.begin(this.meta.name, this.open, ImGui.WindowFlags.NoCollapse)) {
                ImGui.checkbox("Clean workspace", this.clean)
                ImGui.checkbox("Make pak", this.dist)
                if (this.child === undefined) {
                    if (ImGui.smallButton("Build Mod")) {
                        process.chdir(this.dir);
                        let e = "";
                        if (this.clean[0]) e += "c";
                        e += "b";
                        if (this.dist[0]) e += "d";
                        this.child = child_process.exec(`modloader64 -${e}`);
                        this.child.stdout!.on('data', (d: any) => {
                            StatusLog.add(d.toString());
                        });
                        this.child.on('exit', (code: number) => {
                            this.child = undefined;
                        });
                        process.chdir(og);
                    }
                    ImGui.sliderNumber(`Clients###${path.parse(this.dir).name}_Clients`, this.num, 1, 10, '%.0f');
                    if (ImGui.smallButton("Launch mod")){
                        this.child = child_process.exec(`modloader64 -r ${this.num[0]}`);
                        this.child.on('exit', (code: number) => {
                            this.child = undefined;
                        });
                    }
                } else {
                    ImGui.text("Running please wait...");
                }
            }
            ImGui.end();
        } else {
            bus.emit('removeProject', this);
        }
    }
}

class StatusLog {

    static lines: string[] = [""];
    static cur: ImGui.numberRef = [0];

    static add(str: string) {
        this.lines.push(str);
        this.cur[0] = this.cur[0] + 1;
    }

    draw() {
        if (ImGui.begin("Status")) {
            ImGui.listBox("Log", StatusLog.cur, StatusLog.lines, 10);
            ImGui.end();
        }
    }

}

class Config {
    openProjects: string[] = [];
}

let config: Config = new Config();
let config_file: string = path.resolve(og, "SDK-GUI-Config.json");
if (fs.existsSync(config_file)) {
    config = JSON.parse(fs.readFileSync(config_file).toString());
}

export default class GUI extends Application {

    openProjects: Project[] = [];
    status: StatusLog = new StatusLog();

    onInit(): void {
        config.openProjects.forEach((r: string) => {
            let m = path.resolve(r, "package.json");
            let a = JSON.parse(fs.readFileSync(m).toString());
            let p = new Project(r!, a);
            this.openProjects.push(p);
        });
        bus.on('removeProject', (proj: Project) => {
            let i = this.openProjects.indexOf(proj);
            this.openProjects.splice(i, 1);
            i = config.openProjects.indexOf(proj.dir);
            config.openProjects.splice(i, 1);
            fs.writeFileSync(config_file, JSON.stringify(config));
        });
    }

    onNewFrame(): void {
        if (ImGui.beginMainMenuBar()) {
            if (ImGui.beginMenu("File")) {
                if (ImGui.menuItem("Open")) {
                    let r = Gui.getExistingDirectory();
                    if (r !== undefined) {
                        if (config.openProjects.indexOf(r) > -1) return;
                        let m = path.resolve(r, "package.json");
                        let a = JSON.parse(fs.readFileSync(m).toString());
                        let p = new Project(r, a);
                        this.openProjects.push(p);
                        config.openProjects.push(r);
                        fs.writeFileSync(config_file, JSON.stringify(config));
                    }
                }
                ImGui.endMenu();
            }
        }
        ImGui.endMainMenuBar();

        for (let i = 0; i < this.openProjects.length; i++) {
            this.openProjects[i].draw();
        }
        this.status.draw();
    }
}

if (!fs.existsSync("./userSettings.json")){
    fs.writeFileSync("./userSettings.json", template);
}

let app = new GUI("ModLoader64-sdk-gui");
app.run();