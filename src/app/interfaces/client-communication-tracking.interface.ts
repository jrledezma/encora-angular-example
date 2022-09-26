import { StakeholderConfigurationInterface } from ".";

export interface ClientCommunicationTrackingInterface {
  _id?: string;
  trackingType: any;
  client: any;
  clientContact?: string;
  clientCommunicationWay?: any;
  communicationDate?: Date;
  title?: string;
  voiceMediaUrl?: string;
  images?: string[];
  comments: string;
  stakeHolders?: any[];
	stakeholdersConfiguration: StakeholderConfigurationInterface;
  createdBy?: any;
  createdDate?: Date;
  lastModificationUser?: any;
  lastModificationDate?: Date;
  isArchived?: Boolean;
}
