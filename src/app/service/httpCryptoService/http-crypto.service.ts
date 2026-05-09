import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpParams,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { API_HOST, HTTP_CRYPTO_PUBLIC_KEY } from '../../api.config';

type EncryptedPayload = {
  encrypted: true;
  alg: 'RSA-OAEP-256+A256GCM';
  key: string;
  iv: string;
  data: string;
};

type SessionEncryptedPayload = {
  encrypted: true;
  alg: 'A256GCM';
  iv: string;
  data: string;
};

type EncryptedRequest = {
  request: HttpRequest<unknown>;
  responseKey: CryptoKey;
};

@Injectable({
  providedIn: 'root',
})
export class HttpCryptoService {
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();
  private publicKeyPromise?: Promise<CryptoKey>;

  isEnabled(): boolean {
    return HTTP_CRYPTO_PUBLIC_KEY.trim().length > 0;
  }

  shouldHandle(url: string): boolean {
    return url.startsWith(API_HOST) || url.startsWith('/api');
  }

  async encryptRequest(req: HttpRequest<unknown>): Promise<EncryptedRequest> {
    const responseKey = await this.generateSessionKey();
    let body = req.body;
    let params = req.params;

    if (body !== null && body !== undefined && this.isJsonBody(body)) {
      body = await this.encrypt(body, responseKey);
    }

    if (req.params.keys().length > 0) {
      const queryPayload = this.paramsToObject(req.params);
      params = new HttpParams().set(
        'payload',
        JSON.stringify(await this.encrypt(queryPayload, responseKey)),
      );
    } else if (body === null || body === undefined) {
      params = new HttpParams().set(
        'payload',
        JSON.stringify(await this.encrypt({}, responseKey)),
      );
    }

    const request = req.clone({
      body,
      params,
      setHeaders: {
        'x-payload-encrypted': 'true',
      },
    });

    return { request, responseKey };
  }

  async decryptResponse<T>(
    response: HttpResponse<T>,
    responseKey: CryptoKey,
  ): Promise<T> {
    if (!this.isEncryptedPayload(response.body)) {
      return response.body as T;
    }

    return await this.decrypt<T>(response.body, responseKey);
  }

  async decryptError(error: unknown, responseKey: CryptoKey): Promise<unknown> {
    if (
      !(error instanceof HttpErrorResponse) ||
      !this.isEncryptedPayload(error.error)
    ) {
      return error;
    }

    const decryptedError = await this.decrypt(error.error, responseKey);

    return new HttpErrorResponse({
      error: decryptedError,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url ?? undefined,
    });
  }

  private async encrypt(
    value: unknown,
    responseKey: CryptoKey,
  ): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = this.encoder.encode(JSON.stringify(value ?? null));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      responseKey,
      plaintext,
    );
    const rawResponseKey = await crypto.subtle.exportKey('raw', responseKey);
    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      await this.getPublicKey(),
      rawResponseKey,
    );

    return {
      encrypted: true,
      alg: 'RSA-OAEP-256+A256GCM',
      key: this.toBase64(new Uint8Array(encryptedKey)),
      iv: this.toBase64(iv),
      data: this.toBase64(new Uint8Array(encrypted)),
    };
  }

  private async decrypt<T>(
    payload: SessionEncryptedPayload,
    responseKey: CryptoKey,
  ): Promise<T> {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.fromBase64(payload.iv) },
      responseKey,
      this.fromBase64(payload.data),
    );

    return JSON.parse(this.decoder.decode(decrypted)) as T;
  }

  private generateSessionKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  private getPublicKey(): Promise<CryptoKey> {
    if (!this.publicKeyPromise) {
      this.publicKeyPromise = crypto.subtle.importKey(
        'spki',
        this.fromBase64(HTTP_CRYPTO_PUBLIC_KEY),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt'],
      );
    }

    return this.publicKeyPromise;
  }

  private isEncryptedPayload(value: unknown): value is SessionEncryptedPayload {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as Partial<SessionEncryptedPayload>;

    return (
      payload.encrypted === true &&
      payload.alg === 'A256GCM' &&
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
