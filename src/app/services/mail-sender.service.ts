import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class MailSenderService {
  constructor(private httpClient: HttpClient) { }

  public sendMessageFromWebsite(messageData: {
    customerName: string,
    email: string,
    phoneNumber: string,
    message: string
  }): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}mailsender/sendmessagefromwebsite`,
        messageData
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
