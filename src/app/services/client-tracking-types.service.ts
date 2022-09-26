import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClientTrackingTypesService {
  constructor(private httpClient: HttpClient) { }

  public activate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clienttrackingtypes/activate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public inactivate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clienttrackingtypes/inactivate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getAll(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clienttrackingtypes`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getById(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clienttrackingtypes/${id}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public search(filters: any): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}clienttrackingtypes/search`,
        filters
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
