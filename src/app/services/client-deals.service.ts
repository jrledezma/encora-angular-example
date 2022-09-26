import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
	providedIn: 'root',
})
export class ClientDealsService {
	constructor(private httpClient: HttpClient) {}

	public create(data: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}clientdeals `,
				data
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public modify(data: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdeals `,
				data
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public archive(trackingId: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdeals/archive`,
				{ trackingId }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public unarchive(trackingId: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdeals/unarchive`,
				{ trackingId }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public leaveTracking(trackingId: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdeals/leavet`,
				{ trackingId }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getById(id: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.get<ServiceResultInterface>(
				`${environment.api}clientdeals/byid/${id}`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public search(filters: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}clientdeals/search`,
				filters
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getClients(filters: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}clientdeals/getclients`,
				filters
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getTrackingHistoryByClient(
		clientId: string
	): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.get<ServiceResultInterface>(
				`${environment.api}clientdeals/getdealsbyclient/${clientId}`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getTrackingHistoryByID(trackingId: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.get<ServiceResultInterface>(
				`${environment.api}clientdeals/byid/${trackingId}`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public validateReferenceCode(referenceCode: string): Observable<any> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}clientdeals/validaterefcode`,
				{
					referenceCode,
				}
			);
		} catch (ex) {
			console.log('ex =>', ex);
			throw new Error(ex);
		}
	}
}
