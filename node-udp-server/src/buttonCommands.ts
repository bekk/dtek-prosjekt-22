export default {
  PING: new Uint8Array([0]),
  TEXT: new Uint8Array([1]),
  BUTTON_LED: new Uint8Array([2]),
  stringToCommand(str: string): Uint8Array | null {
    switch(str) {
      case "ping":
        return this.PING;
      default:
        return null;
    }
  }
}