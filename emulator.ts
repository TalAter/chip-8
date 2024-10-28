import * as cartridge from "./cartridge/cartridge.ts";
import * as memory from "./memory/memory.ts";
import { font } from "./fonts/font.ts";

const init = (filename: string): boolean => {
    memory.storeFont(font);

    const cartridgeData = cartridge.readChip8File(filename);
    memory.storeROM(cartridgeData);

    return true;
};

export { init };
