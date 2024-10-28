const readChip8File = (path: string): Uint8Array => {
    return Deno.readFileSync(path);
};

export { readChip8File };
