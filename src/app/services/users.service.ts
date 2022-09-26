import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { Observable } from "rxjs";

import { environment } from "src/environments/environment";
import { ServiceResultInterface, UserInterface } from "../interfaces";

@Injectable({
	providedIn: "root",
})
export class UsersService {
	constructor(private httpClient: HttpClient) {}

	public modify(brandData: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}users `,
				brandData
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public activate(id: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}users/activate`,
				{ id }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public inactivate(id: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.put<ServiceResultInterface>(
				`${environment.api}users/inactivate`,
				{ id }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public validateEmail(email: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}users/validateuseremail`,
				{ email }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getAll(): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.get<ServiceResultInterface>(
				`${environment.api}users`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getById(id: string): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.get<ServiceResultInterface>(
				`${environment.api}users/${id}`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getMyInfo(): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.get<ServiceResultInterface>(
				`${environment.api}users/myinfo`
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public search(filters: any): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}users/search`,
				filters
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}
}
