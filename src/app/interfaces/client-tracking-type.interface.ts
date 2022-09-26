export interface ClientTrackingTypeInterface {
  _id: string;
  value: string;
  description: string;
  isActive: boolean;
  lastModifiedUser?: any;
  lastModifiedDate?: Date;
}
