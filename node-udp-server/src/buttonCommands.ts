export default {
  PING: new Uint8Array([0]),
  stringToCommand(str: string): Uint8Array | null {
    switch(str) {
      case "ping":
        return this.PING;
      default:
        return null;
    }
  }
}