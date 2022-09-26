export interface ClientCommunicationTrackingInvitationInterface {
  _id?: string;
  communicationTracking: any;
	stakeholder: any;
	invitationStatus: string;
	invitedby: any;
	invitationDate: Date;
	statusDateChanged?: Date;
}
