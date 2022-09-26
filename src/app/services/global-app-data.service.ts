import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import * as ProductData from '../../products.json';

@Injectable({
  providedIn: 'root'
})
export class GlobalAppDataService {

  protected commerceInfo = new Subject<any>();

  constructor() {
  }

  //setData(data: { itemsQtt: number, moneyQtt }) {
  setCommerceInfo(data: any) {
    this.commerceInfo.next(data);
  }

  //getData(): Observable<{ itemsQtt: number, moneyQtt }> {
  getCommerceInfo(): Observable<string> {
    return this.commerceInfo.asObservable();
  }
}
