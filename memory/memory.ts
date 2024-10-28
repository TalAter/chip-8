const memoryBuffer: ArrayBuffer = new ArrayBuffer(4096);
const memory: Uint8Array = new Uint8Array(memoryBuffer);
const ROM_START = 0x200;
const FONT_START = 0x050;

const storeFont = (data: number[]): boolean => {
  memory.set(data, FONT_START);
  return true;
};

const storeROM = (data: Uint8Array): boolean => {
  memory.set(data, ROM_START);
  return true;
};

const read = (address: number): number => {
  return memory[address];
};

export { FONT_START, ROM_START };
export { read, storeFont, storeROM };
