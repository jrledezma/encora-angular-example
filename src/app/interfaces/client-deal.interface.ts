
export interface ClientDealInterface {
  _id?: string;
  client: any;
  referenceCode: string;
  title: string;
  comments: string;
  mediaUrls?: string[];
  teamMembers?: any[] | string[];
  createdBy?: any;
  createdDate?: Date;
  lastModificationUser?: any;
  lastModificationDate?: Date;
  isArchived?: boolean;
}
