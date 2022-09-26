import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';

import { HomeComponent } from './components/home/home.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';
import { UserConfirmationComponent } from './components/user-confirmation/user-confirmation.component';
import { AdminGuard } from './guards/admin.guard';
import { AuthComponent } from './components/auth/auth.component';
import { ClientsComponent } from './components/clients/clients.component';
import { ClientCommunicationsTrackingComponent } from './components/client-communications-tracking/client-communications-tracking.component';
import { ClientTrackingComponent } from './components/client-tracking/client-tracking.component';
import { ClientTrackingDetailComponent } from './components/client-tracking-detail/client-tracking-detail.component';
import { CloseUserAccountComponent } from './components/close-user-account/close-user-account.component';
import { ClientCommunicationsTrackingInvitationDetailComponent } from './components/client-communications-tracking-invitation-detail/client-communications-tracking-invitation-detail.component';
import { InvitationsComponent } from './components/invitations/invitations.component';
import { TermsAndConditionsComponent } from './components/terms-and-conditions/terms-and-conditions.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ClientDealsComponent } from './components/client-deals/client-deals.component';
import { ClientDealDetailComponent } from './components/client-deal-detail/client-deal-detail.component';

const routes: Routes = [
	{ path: '', component: HomeComponent },

	//landingpage
	{ path: 'auth', component: AuthComponent },
	// mng space
	{
		path: 'clients',
		component: ClientsComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'clientstracking',
		component: ClientCommunicationsTrackingComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'deals',
		component: ClientDealsComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'deal',
		component: ClientDealDetailComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'deal/:id',
		component: ClientDealDetailComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'clientstracking/:clientId',
		component: ClientDealDetailComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'trackinginvitationdetail/:invitationId',
		component: ClientCommunicationsTrackingInvitationDetailComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'clienttrackingdetail/:trackingId',
		component: ClientTrackingDetailComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'invitations',
		component: InvitationsComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{
		path: 'closeaccount',
		component: CloseUserAccountComponent,
		canActivate: [AuthGuard],
		canLoad: [AuthGuard],
	},
	{ path: 'termsandconditions', component: TermsAndConditionsComponent },
	{ path: 'recoverpassword/:token', component: PasswordRecoveryComponent },
	{ path: 'endingregistration/:token', component: UserConfirmationComponent },
	{ path: 'recoveraccount/:token', component: UserConfirmationComponent },
	{ path: '404', component: NotFoundComponent },

	{ path: '**', pathMatch: 'full', redirectTo: '/404' },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
