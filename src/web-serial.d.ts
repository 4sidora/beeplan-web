interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialOutputSignals {
  dataTerminalReady?: boolean;
  requestToSend?: boolean;
  break?: boolean;
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readonly readable: ReadableStream<Uint8Array> | null;
  getInfo(): SerialPortInfo;
  setSignals(signals: SerialOutputSignals): Promise<void>;
}

interface Serial extends EventTarget {
  requestPort(): Promise<SerialPort>;
}

interface Navigator {
  readonly serial: Serial;
}
