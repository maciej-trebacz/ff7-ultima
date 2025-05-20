export class OpcodeWriter {
    start: number
    opcodes: number[] = []
  
    constructor(start: number) {
      this.start = start
    }
  
    get offset() {
      return this.start + this.opcodes.length
    }
  
    write(opcodes: number | number[]) {
      if (Array.isArray(opcodes)) {
        this.opcodes.push(...opcodes)
      } else {
        this.opcodes.push(opcodes)
      }
    }

    writeInt32(value: number) {
      const bytes = new Uint8Array(4)
      bytes[0] = value & 0xFF
      bytes[1] = (value >> 8) & 0xFF
      bytes[2] = (value >> 16) & 0xFF
      bytes[3] = (value >> 24) & 0xFF
      this.write([...bytes])
    }
  
    writePush(value: number) {
      if (value > 255) {
        this.write(0x68) // PUSH int32
        const bytes = new Uint8Array(4)
        bytes[0] = value & 0xFF
        bytes[1] = (value >> 8) & 0xFF
        bytes[2] = (value >> 16) & 0xFF
        bytes[3] = (value >> 24) & 0xFF
        this.write([...bytes])
      } else {
        this.write(0x6a) // PUSH int8
        this.write(value)
      }
    }

    writeDummyCall(args = 0) {
      this.write([0x90, 0x90, 0x90, 0x90, 0x90]) // NOP x5
      if (args > 0) {
        for (let i = 0; i < args; i++) {
          this.write([0x90, 0x90, 0x90, 0x90, 0x90]) // NOP x5
        }
        this.write([0x90, 0x90, 0x90])
      }
    }
  
    writeCall(destination: number, args: number[] = [], noAddEsp = false) {
      if (args.length > 0) {
        const argsReversed = [...args].reverse()
        argsReversed.forEach(arg => {
          this.writePush(arg)
        })
      }
  
      const offset = this.offset
      this.write(0xE8) // CALL
      const relativeAddress = destination - offset - 5
      const bytes = new Uint8Array(4)
      bytes[0] = relativeAddress & 0xFF
      bytes[1] = (relativeAddress >> 8) & 0xFF
      bytes[2] = (relativeAddress >> 16) & 0xFF
      bytes[3] = (relativeAddress >> 24) & 0xFF
      this.write([...bytes])
      if (args.length > 0 && !noAddEsp) {
        this.write([0x83, 0xC4]) // ADD ESP, int8
        this.write(args.length * 4)
      }
    }

    writeJmp(destination: number) {
      const offset = this.offset
      this.write(0xE9) // JMP
      const relativeAddress = destination - offset - 5
      const bytes = new Uint8Array(4)
      bytes[0] = relativeAddress & 0xFF
      bytes[1] = (relativeAddress >> 8) & 0xFF
      bytes[2] = (relativeAddress >> 16) & 0xFF
      bytes[3] = (relativeAddress >> 24) & 0xFF
      this.write([...bytes])
    }

    writeMovEax(destination: number) {
      this.write([0xA3]) // MOV [destination], EAX
      const bytes = new Uint8Array(4)
      bytes[0] = destination & 0xFF
      bytes[1] = (destination >> 8) & 0xFF 
      bytes[2] = (destination >> 16) & 0xFF
      bytes[3] = (destination >> 24) & 0xFF
      this.write([...bytes])
    }
  
    writeStart() {
      this.write([0x55, 0x8B, 0xEC]) // PUSH EBP; MOV EBP,ESP
    }

    writeReturn() {
      this.write([0x5D, 0xC3]) // POP EBP ; RET
    }

    writeHex(hex: string) {
      this.write(hex.split(" ").map(s => parseInt(s, 16)))
    }
  
    toArray() {
      return [...this.opcodes]
    }
  }