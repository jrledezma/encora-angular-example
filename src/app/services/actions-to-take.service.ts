import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ActionsToTakeService {
  constructor(private httpClient: HttpClient) { }

  public getAll(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}actionstotake`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public search(filters: any): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}actionstotake/search`,
        filters
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
