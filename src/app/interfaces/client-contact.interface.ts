export interface ClientContactInterface {
  idNumber?: string;
  firstName: string;
  lastName: string;
  email?: string;
  cellPhone?: string;
  comments?: string;
  isSavedInDB?: boolean;
  createdBy?: any;
  createdDate?: Date;
  lastModificationUser?: any;
  lastModificationDate?: Date;
}
