import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  const inicio = Date.now();

  return next(req).pipe(
    tap({
      next: () => console.log(`✅ ${req.url} — ${Date.now() - inicio}ms`),
      error: (err) => console.error(`❌ ${req.url}`, err)
    })
  );
};