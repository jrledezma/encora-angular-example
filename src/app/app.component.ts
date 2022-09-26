import { Component } from '@angular/core';
import { SessionCacheService, AuthService } from './services';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { TokenService } from './services/token.service';
import { ServiceResultInterface } from './interfaces/service-result.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Absquesoft - E Commerce';
  loggedIn = false;
  showItems = false;

  constructor(
    private router: Router,
    private authSrv: AuthService,
    private sessionCacheSrv: SessionCacheService,
    private tokenSrv: TokenService
  ) {
    this.getSessionData();
    this.sessionCacheSrv.getSessionData().subscribe((observer: any) => {
      if (observer) {
        this.loggedIn = observer.showMenuItems;
        return;
      }
    });
  }

  _opened: boolean = true;

  _toggleSidebar() {
    this._opened = !this._opened;
  }

  ngOnInit() {
    this.sessionCacheSrv.getSessionData().subscribe((observer: any) => {
      if (observer) {
        this.showItems = observer.showMenuOptions;
        return;
      }
      this.showItems = false;
    });
  }

  private async getSessionData() {
    try {
      const sessionToken = localStorage.getItem(environment.session_token);
      if (sessionToken) {
        await this.authSrv.getSessionData().subscribe(
          (observer: any) => {
            this.sessionCacheSrv.setSessionData({
              showMenuOptions: true,
              userFullName: (observer.detail as any).fullName,
              userImage: (observer.detail as any).image,
              invitationsQtt: (observer.detail as any).invitationsQtt,
            });
          },
          (error: any) => {
            localStorage.removeItem(environment.session_token);
            this.router.navigateByUrl('/');
          }
        );
      }
    } catch (ex) {}
  }
}
