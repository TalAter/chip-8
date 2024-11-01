import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import {
    fetch,
    getPC,
    getRegister,
    getRegisterI,
    read,
    resetRegisters,
    setPC,
    setRegister,
    setRegisterI,
    storeFont,
    storeROM,
} from "./memory.ts";
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

    afterEach(() => {
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

describe("setPC", () => {
    it("changes the Program Counter", () => {
        expect(getPC()).toBe(ROM_START);
        setPC(ROM_START + 3);
        expect(getPC()).toBe(ROM_START + 3);
    });
});

describe("registers", () => {
    beforeEach(() => {
        resetRegisters();
    });
    describe("resetRegisters", () => {
        it("resets all registers back to 0", () => {
            setRegister(1, 36);
            setRegister(3, 72);
            resetRegisters();
            expect(getRegister(1)).toBe(0);
            expect(getRegister(3)).toBe(0);
        });
    });

    describe("setRegister", () => {
        it("sets the value of a single register", () => {
            setRegister(1, 36);
            setRegister(3, 72);
            expect(getRegister(1)).toBe(36);
            expect(getRegister(3)).toBe(72);
            expect(getRegister(0)).toBe(0);
        });
    });

    describe("getRegister", () => {
        it("gets the value of a single register", () => {
            expect(getRegister(1)).toBe(0);
            expect(getRegister(3)).toBe(0);
            setRegister(1, 36);
            setRegister(3, 72);
            expect(getRegister(1)).toBe(36);
            expect(getRegister(3)).toBe(72);
        });
    });
});

describe("I register", () => {
    beforeEach(() => {
        setRegisterI(0);
    });

    describe("setRegisterI", () => {
        it("sets the value of a single register", () => {
            setRegisterI(36);
            expect(getRegisterI()).toBe(36);
            setRegisterI(72);
            expect(getRegisterI()).toBe(72);
        });
    });

    describe("getRegisterI", () => {
        it("gets the value of a single register", () => {
            expect(getRegisterI()).toBe(0);
            setRegisterI(36);
            expect(getRegisterI()).toBe(36);
            setRegisterI(72);
            expect(getRegisterI()).toBe(72);
        });
    });
});
