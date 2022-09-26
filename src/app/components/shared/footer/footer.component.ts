import { Component, OnInit } from '@angular/core';
import { ServiceResultInterface } from 'src/app/interfaces';
import { SessionCacheService } from 'src/app/services';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  year: number = new Date().getFullYear();
  mainPhoneNumber = '';
  mainEmail = '';
  facebookUrl = '';
  instagramUrl = '';
  twitterUrl = '';
  showItems = false;

  constructor(public sessionCacheSrv: SessionCacheService) {}

  ngOnInit() {
    this.sessionCacheSrv.getSessionData().subscribe(
      (observer: any) => {
        if (observer) {
          this.showItems = observer.showMenuOptions;
          return;
        }
        this.showItems = false;
      },
      (error: any) => {
        this.showItems = false;
      }
    );
    this.getCommerceContactInfo();
  }

  private getCommerceContactInfo() {}
}
