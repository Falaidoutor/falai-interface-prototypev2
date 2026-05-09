import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';
import { APPLICATION_KEY } from './api.config';
import { HttpCryptoService } from './service/httpCryptoService/http-crypto.service';

export const applicationKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const httpCryptoService = inject(HttpCryptoService);
  const securedRequest = req.clone({
    setHeaders: {
      'x-application-key': APPLICATION_KEY,
    },
  });

  if (
    !httpCryptoService.isEnabled() ||
    !httpCryptoService.shouldHandle(req.url)
  ) {
    return next(securedRequest);
  }

  return from(httpCryptoService.encryptRequest(securedRequest)).pipe(
    switchMap(({ request }) =>
      next(request).pipe(
        mergeMap((event: HttpEvent<unknown>) => {
          if (!(event instanceof HttpResponse)) {
            return of(event);
          }

          return from(httpCryptoService.decryptResponse(event)).pipe(
            mergeMap((body) => of(event.clone({ body }))),
          );
        }),
        catchError((error: HttpErrorResponse) =>
          from(httpCryptoService.decryptError(error)).pipe(
            switchMap((decryptedError) => throwError(() => decryptedError)),
          ),
        ),
      ),
    ),
  ) as Observable<HttpEvent<unknown>>;
};
