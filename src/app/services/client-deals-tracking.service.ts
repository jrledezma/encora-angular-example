import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
	ServiceResultInterface,
	ClientCommunicationTrackingInterface,
} from '../interfaces';

@Injectable({
	providedIn: 'root',
})
export class ClientDealsTrackingService {
	constructor(private httpClient: HttpClient) {}

	public create(data: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}clientdealstracking `,
				data
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public modify(data: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdealstracking `,
				data
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public attentTracking(
		trackingId: string,
		attentionDescription: string,
		newDealTrackingObj: any
	): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}clientdealstracking/attendaction/${trackingId}`,
				{
					trackingId,
					attentionDescription,
					newDealTrackingObj,
				}
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
				`${environment.api}clientdealstracking/leavetracking`,
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

	public search(filters: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}clientdealstracking/search`,
				filters
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getClients(filters: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}clientdealstracking/getclients`,
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
				`${environment.api}clientdealstracking/gettrackingbyclient/${clientId}`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getTrackingHistoryByID(trackingId: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.get<ServiceResultInterface>(
				`${environment.api}clientdealstracking/byid/${trackingId}`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}
}
