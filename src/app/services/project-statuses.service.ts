import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectStatusesService {
  constructor(private httpClient: HttpClient) {}

  public activate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}projectstatuses/activate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public inactivate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}projectstatuses/inactivate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getAll(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}projectstatuses`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getById(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}projectstatuses/${id}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public search(filters: any): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}projectstatuses/search`,
        filters
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
