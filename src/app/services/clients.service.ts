import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
  ServiceResultInterface,
  ClientInterface,
  ClientContactInterface
} from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  constructor(private httpClient: HttpClient) {}

  public create(data: ClientInterface): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}clients `,
        data
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public modify(data: ClientInterface): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clients `,
        data
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public addModifyContact(
    clientId: string,
    contact: ClientContactInterface
  ): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clients/contacts `,
        { clientId, contact }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public activate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clients/activate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public inactivate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clients/inactivate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getAll(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clients`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getContacts(clientId: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clients/contacts/${clientId}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getById(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clients/${id}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public search(filters: any): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}clients/search`,
        filters
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public validateIdNumber(idNumber: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}clients/validateidnumber`,
        { idNumber }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
