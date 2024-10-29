import { connectDisplay, init, mainLoop } from "./emulator/emulator.ts";
import { createTerminalDisplay } from "./display/display.ts";

connectDisplay(createTerminalDisplay());
init("./roms/IBMLogo.ch8");

mainLoop();
