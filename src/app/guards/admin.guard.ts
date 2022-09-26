import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, observable } from 'rxjs';
import { SessionCacheService } from '../services/session-cache.service.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanLoad {

  constructor(private sessionCacheSrv: SessionCacheService) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.sessionCacheSrv.getUserIsAdmin();
  }
  canLoad(
    route: Route,
    segments: UrlSegment[]): boolean {
    return this.sessionCacheSrv.getUserIsAdmin();
  }
}
