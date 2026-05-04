import { HttpInterceptorFn } from '@angular/common/http';
import { APPLICATION_KEY } from './api.config';

export const applicationKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const securedRequest = req.clone({
    setHeaders: {
      'x-application-key': APPLICATION_KEY,
    },
  });

  return next(securedRequest);
};
