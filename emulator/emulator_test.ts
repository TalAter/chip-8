import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { setPC } from "../memory/memory.ts";
import { ROM_START } from "../memory/memory.ts";
import { init, nibbleOpcode } from "../emulator/emulator.ts";

describe("nibbleOpcode", () => {
    it("nibbles a 16 bit to four 4 bit nibbles", () => {
        expect(nibbleOpcode(0x1234)).toEqual([1, 2, 3, 4]);
        expect(nibbleOpcode(0xf000)).toEqual([15, 0, 0, 0]);
        expect(nibbleOpcode(0x0f00)).toEqual([0, 15, 0, 0]);
        expect(nibbleOpcode(0x00f0)).toEqual([0, 0, 15, 0]);
        expect(nibbleOpcode(0x000f)).toEqual([0, 0, 0, 15]);
    });
});

