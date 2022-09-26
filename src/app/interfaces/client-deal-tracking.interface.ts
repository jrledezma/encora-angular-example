export interface ClientDealTrackingInterface {
	_id?: string;
	deal: any;
	actionToTake: any;
	clientContact?: any;
	scheduleDate: Date;
	scheduleHour: string;
	comments?: string;
	mediaUrl?: string[];
	teamMemberInCharge?: any | string;
	createdBy: any;
	createdDate: Date;
	lastModificationUser?: any;
	lastModificationDate?: Date;
	isArchived?: boolean;
}
