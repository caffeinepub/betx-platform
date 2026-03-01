// Stub backend — no canister deployed for this frontend-only app
import type { Identity } from "@icp-sdk/core/agent";

export interface backendInterface {
  _initializeAccessControlWithSecret(token: string): Promise<void>;
}

export type CreateActorOptions = {
  agentOptions?: {
    identity?: Identity | Promise<Identity>;
  };
};

export class ExternalBlob {
  private _url: string;
  private _bytes: Uint8Array | null;

  constructor(url: string, bytes?: Uint8Array) {
    this._url = url;
    this._bytes = bytes ?? null;
  }

  static fromURL(url: string): ExternalBlob {
    return new ExternalBlob(url);
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    return new ExternalBlob("", bytes);
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    const resp = await fetch(this._url);
    const buf = await resp.arrayBuffer();
    return new Uint8Array(buf);
  }

  getURL(): string {
    return this._url;
  }

  onProgress(_progress: number): void {
    // noop
  }
}

export const idlFactory = (_args: unknown): unknown => {
  return {};
};

export const canisterId = "";

export const createActor = (
  _canisterId: string,
  _uploadFile?: unknown,
  _downloadFile?: unknown,
  _options?: CreateActorOptions,
): backendInterface => {
  return {
    _initializeAccessControlWithSecret: async (_token: string) => {},
  } as backendInterface;
};
