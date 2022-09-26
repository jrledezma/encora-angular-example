import { Component, OnInit } from "@angular/core";
import { FormGroup, Validators, FormControl } from "@angular/forms";
import { Router } from "@angular/router";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import Swal, { SweetAlertResult } from "sweetalert2";

import * as ConstValues from "../../../../constant-values";

import * as ProductData from "../../../../products.json";
import { AuthService } from "src/app/services/auth.service";
import { SessionCacheService } from "src/app/services/session-cache.service.service";
import { environment } from "src/environments/environment";
import { ChangePasswordComponent } from "../../modals/change-password/change-password.component";
import { GlobalAppDataService } from "../../../services/global-app-data.service";
import { MyInformationComponent } from "../../modals/my-information/my-information.component";
import { ServiceResultInterface } from "src/app/interfaces";
import { LoginComponent } from '../../modals/login/login.component';

@Component({
	selector: "app-navbar",
	templateUrl: "./navbar.component.html",
	styleUrls: ["./navbar.component.css"],
})
export class NavbarComponent implements OnInit {
	shoppingCartGeneralData: {
		itemsQtt: number;
		moneyQtt: number;
	} = { itemsQtt: 0, moneyQtt: 0 };

	userName = "";
	userImage = "";
	modalOptions = {
		keyboard: false,
		backdrop: false,
		centered: true,
		size: "lg",
		windowClass: "animated fadeIn",
	};
	invitationsQtt = 0;
	signInForm: FormGroup;
	forgotPassword = false;
	showItems = false;

	private toast = ConstValues.Toast;

	constructor(
		private modalSrv: NgbModal,
		public router: Router,
		public authSrv: AuthService,
		public sessionCacheSrv: SessionCacheService
	) {}

	ngOnInit() {
		this.createFormsGroup();
		this.sessionCacheSrv.getSessionData().subscribe(
			(observer: any) => {
				if (observer) {
					this.showItems = observer.showMenuOptions;
					this.userName = observer.userFullName;
					this.userImage = observer.userImage || "https://absque-public-stuff.s3.amazonaws.com/clifoll/user_icon.png";
					this.invitationsQtt = observer.invitationsQtt;
					return;
				}
				this.showItems = false;
				this.userName = "";
				this.userImage = "";
				this.invitationsQtt = 0;
			},
			(error: any) => {
				this.showItems = false;
			}
		);
	}

	returnToHome() {
		this.router.navigateByUrl("/");
	}

	openLoginModal() {
		this.modalOptions.size = "md";
		const modalRef = this.modalSrv.open(
			LoginComponent,
			this.modalOptions
		);
	}

	openChangePasswordModal() {
		this.modalOptions.size = "md";
		const modalRef = this.modalSrv.open(
			ChangePasswordComponent,
			this.modalOptions
		);
	}

	openMyInformationModal() {
		this.modalOptions.size = "lg";
		const modalRef = this.modalSrv.open(
			MyInformationComponent,
			this.modalOptions
		);
	}

	goToCloseAccount() {
		this.router.navigateByUrl("/closeaccount");
	}

	action() {
		if (!this.forgotPassword) {
			this.logIn();
		} else {
			this.recoverPassword();
		}
	}

	setForgotPassword() {
		this.forgotPassword = !this.forgotPassword;
		if (this.forgotPassword) {
			this.signInForm.controls.password.setValidators(null);
			this.signInForm.controls.password.clearValidators();
		} else {
			this.signInForm.controls.password.setValidators([Validators.required]);
		}
	}

	logout() {
		Swal.fire({
			title: "Cerrar Sesión",
			text: "Desea salir de su espacio de trabajo?",
			icon: "question",
			showCancelButton: true,
			cancelButtonText: "Cancelar",
			confirmButtonText: "Cerrar Sesión",
			allowEscapeKey: false,
			allowOutsideClick: false,
			showClass: {
				popup: "animated fadeInUp",
			},
			hideClass: {
				popup: "animated fadeOutUp",
			},
		}).then((value: SweetAlertResult) => {
			if (value.value) {
				Swal.fire({
					title: "Saliendo",
					text: "Por favor espere mientras cerramos su espacio de trabajo",
					icon: "info",
					allowEscapeKey: false,
					allowOutsideClick: false,
					showClass: {
						popup: "animated fadeInUp",
					},
					hideClass: {
						popup: "animated fadeOutUp",
					},
				});
				Swal.showLoading();
				this.authSrv.logOut().subscribe(() => {
					localStorage.setItem(environment.session_token, "");
					this.sessionCacheSrv.setSessionData({
						showMenuOptions: false,
						userFullName: "",
						userImage: "",
						invitationsQtt: 0,
					});
					this.router.navigateByUrl("/");
					Swal.close();
				});
			}
		});
	}

	private createFormsGroup() {
		this.signInForm = new FormGroup({
			email: new FormControl("", [Validators.required, Validators.email]),
			password: new FormControl("", [Validators.required]),
		});

		this.signInForm.setValue({ email: "", password: "" });
	}

	private logIn() {
		try {
			Swal.fire({
				title: "Ingresando",
				text: "Por favor espere mientras obtenemos su espacio de trabajo",
				icon: "info",
				allowEscapeKey: false,
				allowOutsideClick: false,
				showClass: {
					popup: "animated fadeInUp",
				},
				hideClass: {
					popup: "animated fadeOutUp",
				},
			});
			Swal.showLoading();
			this.authSrv
				.login(
					this.signInForm.controls.email.value,
					this.signInForm.controls.password.value
				)
				.subscribe(
					(observer: ServiceResultInterface) => {
						if (observer.code !== "success") {
							if (observer.code === "credentialsError") {
								Swal.fire({
									title: "Datos Incorrectos",
									text: "Los datos del usuario ingresado no son correctos",
									icon: "error",
									allowEscapeKey: false,
									allowOutsideClick: false,
									showClass: {
										popup: "animated fadeInUp",
									},
									hideClass: {
										popup: "animated fadeOutUp",
									},
								});
								return;
							}
							Swal.fire({
								title: "Error",
								text: "Sucedió un error a la hora de validar sus datos",
								icon: "error",
								allowEscapeKey: false,
								allowOutsideClick: false,
								showClass: {
									popup: "animated fadeInUp",
								},
								hideClass: {
									popup: "animated fadeOutUp",
								},
							});
							return;
						}
						localStorage.setItem(environment.session_token, observer.detail);
						this.authSrv.getSessionData().subscribe(
							(observer: any) => {
								Swal.close();
								this.sessionCacheSrv.setSessionData({
									showMenuOptions: true,
									userFullName: (observer.detail as any).fullName,
									userImage: (observer.detail as any).image,
									invitationsQtt: (observer.detail as any).invitationsQtt,
								});
								this.router.navigateByUrl("/")
							},
							(error: any) => {
								Swal.fire({
									title: "Error",
									text: "Error al intentar obtener los datos de la sesión.\n",
									icon: "error",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animate fadeInUp",
									},
								});
							}
						);
					},
					(error: any) => {
						if (error.error.code === "credentialsError") {
							Swal.fire({
								title: "Datos Incorrectos",
								text: "Los datos del usuario ingresado no son correctos",
								icon: "error",
								allowEscapeKey: false,
								allowOutsideClick: false,
								showClass: {
									popup: "animated fadeInUp",
								},
								hideClass: {
									popup: "animated fadeOutUp",
								},
							});
							return;
						}
						Swal.fire({
							title: "Error",
							text: "Sucedió un error a la hora de validar sus datos...",
							icon: "error",
							allowEscapeKey: false,
							allowOutsideClick: false,
							showClass: {
								popup: "animated fadeInUp",
							},
							hideClass: {
								popup: "animated fadeOutUp",
							},
						});
					}
				);
		} catch (ex) {
			Swal.fire({
				title: "Error",
				text: "Sucedió un error a la hora de validar sus datos",
				icon: "error",
				allowEscapeKey: false,
				allowOutsideClick: false,
				showClass: {
					popup: "animated fadeInUp",
				},
				hideClass: {
					popup: "animated fadeOutUp",
				},
			});
		}
	}

	private recoverPassword() {
		try {
			Swal.fire({
				title: "Contactando al Servidor",
				text: "Por favor, espere mientras realizamos las acciones necesarisas para recuperar su contraseña",
				icon: "info",
				allowEscapeKey: false,
				allowOutsideClick: false,
				showClass: {
					popup: "animated fadeInUp",
				},
				hideClass: {
					popup: "animated fadeOutUp",
				},
			});
			Swal.showLoading();
			this.authSrv
				.forgotPasswordRequest(this.signInForm.controls.email.value)
				.subscribe(
					(observer: ServiceResultInterface) => {
						Swal.close();
						if (observer.code !== "success") {
							if (observer.code === "emailNotFound") {
								Swal.fire({
									title: "Datos Incorrectos",
									text: "El correo eléctronico no fue encontrado",
									icon: "error",
									allowEscapeKey: false,
									allowOutsideClick: false,
									showClass: {
										popup: "animated fadeInUp",
									},
									hideClass: {
										popup: "animated fadeOutUp",
									},
								});
								return;
							}
							Swal.fire({
								title: "Error",
								text: "Sucedió un error a la hora de validar el correo electronico",
								icon: "error",
								allowEscapeKey: false,
								allowOutsideClick: false,
								showClass: {
									popup: "animated fadeInUp",
								},
								hideClass: {
									popup: "animated fadeOutUp",
								},
							});
							return;
						}
						Swal.fire({
							title: "Solicitud Realizada",
							text: "Se ha enviado un correo eléctronico con la información necesaria para recuperar la contraseña",
							icon: "info",
							allowEscapeKey: false,
							allowOutsideClick: false,
							showClass: {
								popup: "animated fadeInUp",
							},
							hideClass: {
								popup: "animated fadeOutUp",
							},
						});
						this.router.navigate(["/"]);
					},
					(error: any) => {
						Swal.close();
						if (
							error.error.code === "notDataFound" ||
							error.error.code === "emailNotFound"
						) {
							Swal.fire({
								title: "Datos Incorrectos",
								text: "El correo eléctronico no fue encontrado",
								icon: "error",
								allowEscapeKey: false,
								allowOutsideClick: false,
								showClass: {
									popup: "animated fadeInUp",
								},
								hideClass: {
									popup: "animated fadeOutUp",
								},
							});
							return;
						}
						Swal.fire({
							title: "Error",
							text: "Sucedió un error a la hora de validar el correo eléctronico.",
							icon: "error",
							allowEscapeKey: false,
							allowOutsideClick: false,
							showClass: {
								popup: "animated fadeInUp",
							},
							hideClass: {
								popup: "animated fadeOutUp",
							},
						});
					}
				);
		} catch (ex) {
			Swal.close();
			Swal.fire({
				title: "Error",
				text: "Sucedió un error a la hora de validar el correo eléctronico",
				icon: "error",
				allowEscapeKey: false,
				allowOutsideClick: false,
				showClass: {
					popup: "animated fadeInUp",
				},
				hideClass: {
					popup: "animated fadeOutUp",
				},
			});
		}
	}
}
