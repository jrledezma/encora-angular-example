import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ServiceResultInterface } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClientCommunicationInvitationsService {
  constructor(private httpClient: HttpClient) { }

  public getById(id: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}trackinginvitations/getstakeholderinvitation/${id}`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getAllInvitationsByUser(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}trackinginvitations`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getAsStakeholder(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}trackinginvitations/asstakeholder`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public getAsInvitedBy(): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.get<ServiceResultInterface>(
        `${environment.api}trackinginvitations/asinvitedby`
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public acceptInvitation(invitationId: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}trackinginvitations/accept`,
        {
          invitationId
        }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public rejectInvitation(invitationId: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}trackinginvitations/reject`,
        {
          invitationId
        }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public revokeInvitation(invitationId: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}trackinginvitations/revoke`,
        {
          invitationId
        }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public leaveInvitation(invitationId: string): Observable<ServiceResultInterface> {
    try {
      return this.httpClient.put<ServiceResultInterface>(
        `${environment.api}trackinginvitations/leave`,
        {
          invitationId
        }
      );
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
