import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpParams,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { API_HOST, HTTP_CRYPTO_SECRET } from '../../api.config';

type EncryptedPayload = {
  encrypted: true;
  alg: 'AES-256-GCM';
  iv: string;
  data: string;
};

type EncryptedRequest = {
  request: HttpRequest<unknown>;
};

@Injectable({
  providedIn: 'root',
})
export class HttpCryptoService {
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();
  private keyPromise?: Promise<CryptoKey>;

  isEnabled(): boolean {
    return HTTP_CRYPTO_SECRET.trim().length > 0;
  }

  shouldHandle(url: string): boolean {
    return url.startsWith(API_HOST) || url.startsWith('/api');
  }

  async encryptRequest(req: HttpRequest<unknown>): Promise<EncryptedRequest> {
    let body = req.body;
    let params = req.params;

    if (body !== null && body !== undefined && this.isJsonBody(body)) {
      body = await this.encrypt(body);
    }

    if (req.params.keys().length > 0) {
      const queryPayload = this.paramsToObject(req.params);
      params = new HttpParams().set(
        'payload',
        JSON.stringify(await this.encrypt(queryPayload)),
      );
    }

    const request = req.clone({
      body,
      params,
      setHeaders: {
        'x-payload-encrypted': 'true',
      },
    });

    return { request };
  }

  async decryptResponse<T>(response: HttpResponse<T>): Promise<T> {
    if (!this.isEncryptedPayload(response.body)) {
      return response.body as T;
    }

    return await this.decrypt<T>(response.body);
  }

  async decryptError(error: unknown): Promise<unknown> {
    if (
      !(error instanceof HttpErrorResponse) ||
      !this.isEncryptedPayload(error.error)
    ) {
      return error;
    }

    const decryptedError = await this.decrypt(error.error);

    return new HttpErrorResponse({
      error: decryptedError,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url ?? undefined,
    });
  }

  private async encrypt(value: unknown): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = this.encoder.encode(JSON.stringify(value ?? null));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      await this.getKey(),
      plaintext,
    );

    return {
      encrypted: true,
      alg: 'AES-256-GCM',
      iv: this.toBase64(iv),
      data: this.toBase64(new Uint8Array(encrypted)),
    };
  }

  private async decrypt<T>(payload: EncryptedPayload): Promise<T> {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.fromBase64(payload.iv) },
      await this.getKey(),
      this.fromBase64(payload.data),
    );

    return JSON.parse(this.decoder.decode(decrypted)) as T;
  }

  private getKey(): Promise<CryptoKey> {
    if (!this.keyPromise) {
      this.keyPromise = crypto.subtle
        .digest('SHA-256', this.encoder.encode(HTTP_CRYPTO_SECRET))
        .then((digest) =>
          crypto.subtle.importKey('raw', digest, 'AES-GCM', false, [
            'encrypt',
            'decrypt',
          ]),
        );
    }

    return this.keyPromise;
  }

  private isEncryptedPayload(value: unknown): value is EncryptedPayload {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as Partial<EncryptedPayload>;

    return (
      payload.encrypted === true &&
      payload.alg === 'AES-256-GCM' &&
      typeof payload.iv === 'string' &&
      typeof payload.data === 'string'
    );
  }

  private paramsToObject(params: HttpParams): Record<string, string | string[]> {
    return params.keys().reduce<Record<string, string | string[]>>((acc, key) => {
      const values = params.getAll(key) ?? [];
      acc[key] = values.length > 1 ? values : values[0] ?? '';
      return acc;
    }, {});
  }

  private isJsonBody(body: unknown): boolean {
    return (
      !(body instanceof FormData) &&
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof URLSearchParams)
    );
  }

  private toBase64(bytes: Uint8Array): string {
    let binary = '';

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  private fromBase64(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }
}
