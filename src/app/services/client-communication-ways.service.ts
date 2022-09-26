import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClientCommunicationWaysService {
  constructor(private httpClient: HttpClient) { }

  public activate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clientcommunicationways/activate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public inactivate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clientcommunicationways/inactivate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getAll(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clientcommunicationways`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getById(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clientcommunicationways/${id}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public search(filters: any): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}clientcommunicationways/search`,
        filters
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
