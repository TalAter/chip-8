const memoryBuffer: ArrayBuffer = new ArrayBuffer(4096);
const memory: Uint8Array = new Uint8Array(memoryBuffer);
const ROM_START = 0x200;
const FONT_START = 0x050;

let PC: number = ROM_START; // The Program Counter. Points at the current instruction in memory

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

const parseOpcodes = (data: Uint8Array): string => {
  const opcode = (data[0] << 8) | data[1];
  return opcode.toString(16).padStart(4, "0");
};

const fetch = () => {
  const opcodes = parseOpcodes(memory.slice(PC, PC + 2));
  PC += 2;
  return opcodes;
};

const setPC = (addr: number): void => {
  PC = addr;
};

export { FONT_START, ROM_START };
export { fetch, read, setPC, storeFont, storeROM };
