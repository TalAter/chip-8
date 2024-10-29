import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { assertSpyCalls, Spy, spy } from "jsr:@std/testing/mock";
import { fetch, setPC, storeROM } from "../memory/memory.ts";
import { ROM_START } from "../memory/memory.ts";
import * as emulator from "../emulator/emulator.ts";
import { createTerminalDisplay, Display } from "../display/display.ts";

describe("nibbleOpcode", () => {
    it("nibbles a 16 bit to four 4 bit nibbles", () => {
        expect(emulator.nibbleOpcode(0x1234)).toEqual([1, 2, 3, 4]);
        expect(emulator.nibbleOpcode(0xf000)).toEqual([15, 0, 0, 0]);
        expect(emulator.nibbleOpcode(0x0f00)).toEqual([0, 15, 0, 0]);
        expect(emulator.nibbleOpcode(0x00f0)).toEqual([0, 0, 15, 0]);
        expect(emulator.nibbleOpcode(0x000f)).toEqual([0, 0, 0, 15]);
    });
});

describe("decodeAndExecute", () => {
    let mockDisplay: Display;
    let clearSpy: Spy;

    beforeEach(() => {
        clearSpy = spy(() => {});
        mockDisplay = {
            clear: clearSpy,
            render: () => {},
        };
        emulator.connectDisplay(mockDisplay);
        const cartridgeData = new Uint8Array([0x00, 0xe0, 0xa2, 0x2a]);
        storeROM(cartridgeData);
        setPC(ROM_START);
    });

    afterEach(() => {
        emulator.connectDisplay(createTerminalDisplay());
    });

    describe("00E0", () => {
        it("calls display.clear()", () => {
            const opcode = fetch();
            assertSpyCalls(clearSpy, 0);
            emulator.decodeAndExecute(opcode);
            assertSpyCalls(clearSpy, 1);
        });
    });
});
