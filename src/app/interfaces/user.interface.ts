export interface UserInterface {
	_id: string;
	firstName?: string;
	lastName?: string;
	email: string;
	countryCode?: string;
	phoneNumber?: string;
	image?: string;
	about?: string;
	status?: string;
	createdDate: Date;
}
