import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Observable, observable, Subject } from 'rxjs';
import { ServiceResultInterface } from '../interfaces/service-result.interface';
import { UserInterface } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  protected subject: boolean;

  constructor(private httpClient: HttpClient) { }

  public generate(): Observable<any> {
    try {
      return this.httpClient.post(`${environment.api}token/`,
        {
          key: this.randomString(18)
        });
    } catch (ex) {
      throw new Error(ex);
    }
  }

  private randomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}