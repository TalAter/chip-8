const memoryBuffer: ArrayBuffer = new ArrayBuffer(4096);
const memory: Uint8Array = new Uint8Array(memoryBuffer);
const ROM_START = 0x200;
const FONT_START = 0x050;

const PC = new Uint16Array(1); // The Program Counter. Points at the current instruction in memory
PC[0] = ROM_START;

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

const fetch = (): number => {
  const opcodes = (memory[PC[0]] << 8) | memory[PC[0] + 1];
  PC[0] += 2 & 0xFFFF; // Ensure PC stays 16-bit after increment
  return opcodes;
};

const setPC = (addr: number): void => {
  PC[0] = addr & 0xFFFF;
};

const getPC = (): number => PC[0];

export { FONT_START, ROM_START };
export { fetch, getPC, read, setPC, storeFont, storeROM };
