import { assertEquals, assertInstanceOf } from "@std/assert";
import { readChip8File } from "./cartridge.ts";

Deno.test("test readChip8File", function test_readChip8File() {
    const ROMcontents = readChip8File("./roms/IBMLogo.ch8");
    assertInstanceOf(ROMcontents, Uint8Array);
    assertEquals(ROMcontents.length, 132);
});
