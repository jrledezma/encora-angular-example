import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
	providedIn: 'root',
})
export class ClientDealTrackingsService {
	constructor(private httpClient: HttpClient) {}

	public create(trackingData: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}clientdealstracking`,
				trackingData
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public archive(trackingId: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdealstracking/archive`,
				{ trackingId }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public unarchive(trackingId: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdealstracking/unarchive`,
				{ trackingId }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public leaveTracking(trackingId: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdealstracking/leavet`,
				{ trackingId }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getById(id: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.get<ServiceResultInterface>(
				`${environment.api}clientdealstracking/byid/${id}`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}
}
