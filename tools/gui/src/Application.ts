import { $, AppWindow, ImGui, Gui } from 'ml64tk'
import * as fs from 'fs'

export abstract class Application {
    private settings: any;
    protected appWindow: AppWindow;
    private checkColorSchemeTicks: number;
    private colorScheme: Gui.ColorScheme | undefined;

    constructor(title: string) {
        this.settings = JSON.parse(fs.readFileSync('userSettings.json', { encoding: 'utf-8' }));

        this.appWindow = new AppWindow(this.settings.vsync, this.settings.viewports);
        this.appWindow.on('init', this.init.bind(this));
        this.appWindow.on('new-frame', this.newFrame.bind(this));
        this.appWindow.title = title;
        //this.appWindow.setIconFromFile('assets/onil.png');

        this.checkColorSchemeTicks = 0;
        if (this.settings.colorScheme == "dark") this.colorScheme = Gui.ColorScheme.PreferDark;
        else if (this.settings.colorScheme == "system") this.colorScheme = undefined;
        else this.colorScheme = Gui.ColorScheme.PreferLight;
    }

    run(): void {
        const loop = setInterval((() => {
            if (this.appWindow.doIteration()) {
                clearInterval(loop);
                this.onQuit();
            }
        }).bind(this), 0);
    }

    private init(): void {
        this.updateColorScheme();
        this.loadFont();
        this.onInit();
    }

    private newFrame(): void {
        // check if the color scheme was changed and update
        if (this.colorScheme == undefined && AppWindow.ticks > this.checkColorSchemeTicks + 1000) {
            this.updateColorScheme();
            this.checkColorSchemeTicks = AppWindow.ticks;
        }

        this.createMainDockSpace(); // ImGui windows can be docked in the main window area
        this.onNewFrame();
    }

    private loadFont(): void {
        //ImGui.getIO().fonts.addFontFromFile('assets/Roboto-Regular.ttf', 20);
    }

    private updateColorScheme(): void {
        let colorScheme = this.colorScheme;
        if (colorScheme == undefined) colorScheme = Gui.getColorScheme();

        if (colorScheme == Gui.ColorScheme.PreferDark) {
            ImGui.styleColorsDark();
            // @ts-ignore
            if (Gui.useImmersiveDarkMode) Gui.useImmersiveDarkMode(ImGui.getMainViewport(), true);
            // useImmersiveDarkMode() is Windows specific and turns the window in dark mode (since Windows 10 2004 (20H1)?, works on Windows 11)
        }
        else {
            ImGui.styleColorsLight();
            // @ts-ignore
            if (Gui.useImmersiveDarkMode) Gui.useImmersiveDarkMode(ImGui.getMainViewport(), false);
        }
        this.appWindow.clearColor = ImGui.getStyleColor(ImGui.Col.WindowBg);
    }

    private createMainDockSpace(): void {
        const mainViewport = ImGui.getMainViewport();
        ImGui.setNextWindowViewport(mainViewport.id);
        ImGui.setNextWindowPos(mainViewport.workPos, ImGui.Cond.Always);
        ImGui.setNextWindowSize(mainViewport.workSize, ImGui.Cond.Always);
        ImGui.pushStyleVar(ImGui.StyleVar.WindowPadding, $.xy(0, 0));
        ImGui.pushStyleColor(ImGui.Col.DockingEmptyBg, $.rgbaf(0, 0, 0, 0));
        ImGui.begin("##MainWindowDockSpace", undefined, ImGui.WindowFlags.NoNav | ImGui.WindowFlags.NoDecoration
            | ImGui.WindowFlags.NoSavedSettings | ImGui.WindowFlags.NoBackground
            | ImGui.WindowFlags.NoBringToFrontOnFocus | ImGui.WindowFlags.NoFocusOnAppearing);
        ImGui.dockSpace(ImGui.getId("MainDockSpace"));
        ImGui.end();
        ImGui.popStyleColor();
        ImGui.popStyleVar();
    }

    abstract onInit(): void;
    abstract onNewFrame(): void;
    onQuit(): void { }
}
