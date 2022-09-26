import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { environment } from "../../environments/environment";
import { Observable, observable, Subject } from "rxjs";
import { ServiceResultInterface } from "../interfaces/service-result.interface";
import { UserInterface } from "../interfaces";

@Injectable({
	providedIn: "root",
})
export class AuthService {
	protected subject: boolean;

	constructor(private httpClient: HttpClient) {}

	public signUp(email: string): Observable<any> {
		try {
			return this.httpClient.post(`${environment.api}auth/signup`, {
				email: email,
			});
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public login(email: string, password: string): Observable<any> {
		try {
			console.log("environment.api =>", environment.api)
			return this.httpClient.post(`${environment.api}auth/login`, {
				email: email,
				password: password,
			});
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public logOut(): Observable<any> {
		try {
			return this.httpClient.get(`${environment.api}auth/logout`);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getSessionData(): Observable<any> {
		try {
			return this.httpClient.get(`${environment.api}auth/sessiondata`);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public getUserData(): Observable<any> {
		try {
			return this.httpClient.get(`${environment.api}auth/userdata`);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public isLoggedIn(): Observable<any> {
		return this.httpClient.get(`${environment.api}auth/sessiondata`);
	}

	public changePassword(
		currentPassword: string,
		password: string
	): Observable<any> {
		try {
			return this.httpClient.put(`${environment.api}auth/changepassword`, {
				currentPassword,
				password,
			});
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public forgotPasswordRequest(userEmail: string) {
		try {
			return this.httpClient.post(
				`${environment.api}auth/forgotpasswordrequest`,
				{ email: userEmail }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public validatePasswordToken(token: string) {
		try {
			return this.httpClient.post(
				`${environment.api}auth/validaterecoverpasswordtoken`,
				{ token }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public forgotPassword(password: string, token: string) {
		try {
			return this.httpClient.post(`${environment.api}auth/recoverpassword`, {
				password,
				token,
			});
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public verifyConfirmUserToken(
		token: string
	): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}auth/validateconfirmationtoken`,
				{ token }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public verifyRecoverUserToken(
		token: string
	): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}auth/validaterecoveraccounttoken`,
				{ token }
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public endUserRegistration(
		userData: any
	): Observable<ServiceResultInterface> {
		try {
			return this.httpClient.post<ServiceResultInterface>(
				`${environment.api}auth/enduserregistration`,
				userData
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public closeAccount(email: string, password: string) {
		try {
			return this.httpClient.put(`${environment.api}auth/closeaccount`, {
				email,
				password,
			});
		} catch (ex) {
			throw new Error(ex);
		}
	}

	public recoverClosedAccount(
		token: string,
		password: string,
		confirmPassword: string
	) {
		try {
			return this.httpClient.put(
				`${environment.api}auth/recoverclosedaccount`,
				{
					token,
					password,
					confirmPassword,
				}
			);
		} catch (ex) {
			throw new Error(ex);
		}
	}
}
