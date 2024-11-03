import { init, mainLoop } from "./emulator/emulator.ts";

// Get command line argument
const romFile = Deno.args[0];

if (!romFile) {
    console.error("Please provide a ROM file path as an argument");
    Deno.exit(1);
}

init(romFile);
mainLoop();
