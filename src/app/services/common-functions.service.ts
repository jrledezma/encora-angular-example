import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommonFunctionsService {
  constructor() {}

  public generateUUID(useDash?: boolean): string {
    var date = new Date().getTime();
    var uuid = useDash
      ? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      : 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
          var r = (date + Math.random() * 16) % 16 | 0;
          date = Math.floor(date / 16);
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
    return uuid;
  }
}
