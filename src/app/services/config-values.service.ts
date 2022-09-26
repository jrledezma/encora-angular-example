import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ConfigValuesService {
  constructor(private httpClient: HttpClient) { }

  public getUserStatus(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}configvalues/userstatus`,
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
