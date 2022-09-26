import { Injectable } from "@angular/core";
import { Observable, Subject, BehaviorSubject } from "rxjs";

interface SessionData {
	showMenuOptions: boolean;
	userFullName: string;
	userImage: string;
	invitationsQtt: number;
}

@Injectable({
	providedIn: "root",
})
export class SessionCacheService {
	protected subject = new BehaviorSubject<SessionData>({
		showMenuOptions: false,
		userFullName: "",
		userImage: "",
		invitationsQtt: 0
	});
	protected logoSubject = new Subject<string>();

	constructor() {}

	setSessionData(sessionData: SessionData) {
		this.subject.next(sessionData);
	}

	getCurrentSessionData(): any {
		return this.subject.getValue();
	}

	getSessionData(): Observable<SessionData> {
		return this.subject.asObservable();
	}

	getUserIsAdmin(): boolean {
		//return (this.subject.value as any).userIsAdmin;
    return false;
	}

	setInvitationsQtt(invitationsQtt) {
		let sessionData = this.subject.getValue()
		sessionData.invitationsQtt = invitationsQtt;
		this.subject.next(sessionData); 
		this.subject
	}
}
