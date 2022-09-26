import { environment } from '../../environments/environment';
import {
	HttpInterceptor,
	HttpHandler,
	HttpEvent,
	HttpRequest,
	HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as ConstValues from '../../constant-values';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SessionCacheService } from '../services';

@Injectable()
export class SetAuthTokenInterceptor implements HttpInterceptor {
	private toast = ConstValues.Toast;

	constructor(
		private router: Router,
		private modal: NgbModal,
		private sessionCacheSrv: SessionCacheService
	) {}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const url = req.url.split('/')[req.url.split('/').length - 1];
		if (url !== 'signup' && url !== 'login') {
			req = req.clone({
				setHeaders: {
					Authorization: localStorage.getItem(environment.session_token)
						? localStorage.getItem(environment.session_token)
						: '',
				},
			});
		}

		return next.handle(req).pipe(
			catchError((error: HttpErrorResponse) => {
				if (!(error.error instanceof ErrorEvent)) {
					if (error.status === 403) {
						Swal.close();
						this.modal.dismissAll();
						this.router.navigateByUrl('/');
						this.sessionCacheSrv.setSessionData({
							showMenuOptions: false,
							userFullName: '',
							userImage: '',
							invitationsQtt: 0,
						});
						localStorage.removeItem(environment.session_token);
						this.toast.fire({
							icon: 'error',
							text: `Tu sesión ha finalizado`,
						});
						return throwError('unauthorized');
					}
				}
				return throwError(error);
			})
		);
	}
}
