import { ClientContactInterface } from './client-contact.interface';

export interface ClientInterface {
  _id?: string;
  idNumber: string;
  companyName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  wayOfEntry: any;
  dateOfEntry: Date;
  comments?: string;
  contacts?: ClientContactInterface[];
  configuration?: {
    canShowIdNumber: boolean,
    canShowEmailAddress: boolean,
    canShowPhoneNumber: boolean;
  };
  isActive: boolean;
  createdBy?: any;
  createdDate?: Date;
  lastModificationUser?: any;
  lastModificationDate?: Date;
}
