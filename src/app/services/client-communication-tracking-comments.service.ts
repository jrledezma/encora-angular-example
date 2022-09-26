import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
  ServiceResultInterface,
  ClientCommunicationTrackingCommentInterface
} from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClientCommunicationTrackingCommentsService {
  constructor(private httpClient: HttpClient) {}

  public create(data: ClientCommunicationTrackingCommentInterface): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.post<ServiceResultInterface>(
        `${environment.api}clienttrackingcomments `,
        data
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public activate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clienttrackingcomments/activate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public inactivate(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}clienttrackingcomments/inactivate`,
        { id }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getByTrackingId(trackingId): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clienttrackingcomments/bytrackingid/${trackingId}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getByUserId(userId): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clienttrackingcomments/byuser/${userId}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getById(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}clienttrackingcomments/${id}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
