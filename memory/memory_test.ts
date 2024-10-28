import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { fetch, read, setPC, storeFont, storeROM } from "./memory.ts";
import { FONT_START, ROM_START } from "./memory.ts";
import { font } from "../fonts/font.ts";
import { init } from "../emulator/emulator.ts";

describe("storeFont", () => {
    it("stores the font in memory", () => {
        storeFont(font);

        expect(read(FONT_START)).toBe(0xF0);
        expect(read(FONT_START + 1)).toBe(0x90);
    });
});

describe("storeROM", () => {
    it("stores the correct data in memory", () => {
        const sampleData = new Uint8Array(2);
        sampleData.set([0, 224]); // aka 0x00 and 0xE0
        storeROM(sampleData);

        expect(read(ROM_START)).toBe(0x00);
        expect(read(ROM_START + 1)).toBe(0xE0);
    });
});

describe("fetch", () => {
    beforeEach(() => {
        init("./roms/IBMLogo.ch8");
        setPC(ROM_START);
    });

    it("fetches the opcode at the current PC", () => {
        expect(fetch()).toBe(0x00e0);
    });

    it("moves the PC forward by 2", () => {
        expect(fetch()).toBe(0x00e0);
        expect(fetch()).toBe(0xa22a);
        expect(fetch()).toBe(0x600c);
    });
});
