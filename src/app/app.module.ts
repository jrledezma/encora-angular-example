import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { AgmCoreModule, GoogleMapsAPIWrapper } from '@agm/core';

import {
	NgbModule,
	NgbModalModule,
	NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgKnifeModule } from 'ng-knife';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SidebarModule } from 'ng-sidebar';

import { SetAuthTokenInterceptor } from './interceptors/set-auth-token-interceptor.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { DecimalInputDirective } from './directives/decimal-input.directive';
import { LoginComponent } from './components/modals/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { ChangePasswordComponent } from './components/modals/change-password/change-password.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';
import { UserConfirmationComponent } from './components/user-confirmation/user-confirmation.component';
import { AuthComponent } from './components/auth/auth.component';
import { ClientsComponent } from './components/clients/clients.component';
import { ClientModalComponent } from './components/clients/client-modal.component';
import { ClientSearchModalComponent } from './components/modals/client-search-modal/client-search-modal.component';
import { ClientContactModalComponent } from './components/modals/client-contact-modal/client-contact-modal.component';
import { ClientCommunicationsTrackingComponent } from './components/client-communications-tracking/client-communications-tracking.component';
import { ClientCommunicationTrackingModalComponent } from './components/client-communications-tracking/client-communication-tracking-modal.component';
import { ClientTrackingComponent } from './components/client-tracking/client-tracking.component';
import { ClientTrackingDetailComponent } from './components/client-tracking-detail/client-tracking-detail.component';
import { UserInfoDetailComponent } from './components/modals/user-info-detail/user-info-detail.component';
import { MyInformationComponent } from './components/modals/my-information/my-information.component';
import { CloseUserAccountComponent } from './components/close-user-account/close-user-account.component';
import { ClientCommunicationsTrackingInvitationDetailComponent } from './components/client-communications-tracking-invitation-detail/client-communications-tracking-invitation-detail.component';
import { InvitationsComponent } from './components/invitations/invitations.component';
import { TermsAndConditionsComponent } from './components/terms-and-conditions/terms-and-conditions.component';
import { ImageModalComponent } from './components/modals/image-modal/image-modal.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ClientDealsComponent } from './components/client-deals/client-deals.component';
import { ClientDealModalComponent } from './components/client-deals/client-deal-modal.component';
import { ClientDealDetailComponent } from './components/client-deal-detail/client-deal-detail.component';
import { AttendNextActionComponent } from './components/client-deal-detail/attend-next-action.component';
import { CreateNextActionComponent } from './components/client-deal-detail/create-next-action.component';

@NgModule({
	entryComponents: [
		ChangePasswordComponent,
		ClientModalComponent,
		ClientSearchModalComponent,
		ClientContactModalComponent,
		ClientCommunicationTrackingModalComponent,
		UserInfoDetailComponent,
		MyInformationComponent,
		ImageModalComponent,
		LoginComponent,
		ClientDealModalComponent,
		AttendNextActionComponent,
		CreateNextActionComponent,
	],
	declarations: [
		AppComponent,
		NavbarComponent,
		FooterComponent,
		HomeComponent,
		DecimalInputDirective,
		LoginComponent,
		ChangePasswordComponent,
		PasswordRecoveryComponent,
		UserConfirmationComponent,
		AuthComponent,
		ClientsComponent,
		ClientModalComponent,
		ClientSearchModalComponent,
		ClientContactModalComponent,
		ClientCommunicationsTrackingComponent,
		ClientCommunicationTrackingModalComponent,
		ClientTrackingComponent,
		ClientTrackingDetailComponent,
		UserInfoDetailComponent,
		MyInformationComponent,
		CloseUserAccountComponent,
		ClientCommunicationsTrackingInvitationDetailComponent,
		InvitationsComponent,
		TermsAndConditionsComponent,
		ImageModalComponent,
		NotFoundComponent,
		ClientDealsComponent,
		ClientDealModalComponent,
		ClientDealDetailComponent,
		AttendNextActionComponent,
		CreateNextActionComponent,
	],
	imports: [
		CommonModule,
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		RouterModule,
		NgbModule,
		NgbModalModule,
		NgbDatepickerModule,
		NgxPaginationModule,
		NgSelectModule,
		ColorPickerModule,
		NgKnifeModule,
		NgxDropzoneModule,
		DragDropModule,
		QuillModule.forRoot({
			placeholder: 'Ingresar texto aquí ...',
			modules: {
				syntax: false,
				toolbar: [
					['bold', 'italic', 'underline', 'strike'], // toggled buttons
					['blockquote'],
					[{ header: 1 }, { header: 2 }], // custom button values
					[{ list: 'projected' }, { list: 'bullet' }],
					[{ indent: '-1' }, { indent: '+1' }], // outdent/indent
					[{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
					[{ header: [1, 2, 3, 4, 5, 6, false] }],
					[{ align: [] }],
					['link'],
					// ['link', 'image']
				],
			},
		}),
		AgmCoreModule.forRoot({
			apiKey: '',
			libraries: ['places'],
		}),
		SidebarModule.forRoot(),
	],
	providers: [
		AuthGuard,
		{ provide: HTTP_INTERCEPTORS, useClass: SetAuthTokenInterceptor, multi: true },
		GoogleMapsAPIWrapper,
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
