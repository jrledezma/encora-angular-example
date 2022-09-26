export interface ClientWayOfEntryInterface {
  _id: string;
  code: string;
  value: string;
  description: string;
  isActive: boolean;
  lastModifiedUser?: any;
  lastModifiedDate?: Date;
}
