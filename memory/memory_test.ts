import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { FONT_START, read, ROM_START, storeFont, storeROM } from "./memory.ts";
import { font } from "../fonts/font.ts";

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
