import { Component, OnInit } from "@angular/core";
import { FormGroup, Validators, FormControl } from '@angular/forms';
import Swal from "sweetalert2";
import { AuthService } from "../../services/auth.service";
import { ServiceResultInterface } from "../../interfaces/service-result.interface";
import { SessionCacheService } from "src/app/services";
import { environment } from "src/environments/environment";
import { Router } from "@angular/router";

@Component({
	selector: "app-close-user-account",
	templateUrl: "./close-user-account.component.html",
	styles: [],
})
export class CloseUserAccountComponent implements OnInit {

	credentialsForm: FormGroup;

	constructor(
		private authSrv: AuthService,
		private router: Router,
		public sessionCacheSrv: SessionCacheService
	) {}

	ngOnInit() {
		this.createFormsGroup();
	}

	closeAccount() {
		try {
			Swal.fire({
				title: "Cerrar Cuenta",
				text: "¿Desea cerrar su cuenta en Clifoll?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Cerrar Cuenta",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: "Cerrando Cuenta",
						text: "Se esta cerrando su cuenta, por favor espere",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();
					this.authSrv
						.closeAccount(this.credentialsForm.controls.email.value, this.credentialsForm.controls.password.value)
						.subscribe((observer: ServiceResultInterface) => {
							if (observer.code !== "success") {
								if(observer.code === "notDataFound"){
									Swal.fire({
										title: "Datos no Encontrados",
										text: "No fue posible encontrar el usuario asociado a Correo Electrónico y Password ingresados",
										icon: "warning",
										allowOutsideClick: false,
										allowEscapeKey: true,
										showClass: {
											popup: "animated fadeInUp",
										},
									});
									return;
								}
								Swal.fire({
									title: "Error",
									text: "Sucedió un error al intentar cerrar su cuenta",
									icon: "error",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animated fadeInUp",
									},
								});
								return;
							}
							Swal.fire({
								title: "Cuenta Cerrada",
								text: "Tu cuenta fue cerrada satisfactoriamente",
								icon: "info",
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: "animated fadeInUp",
								},
							}).then(() => {
								this.authSrv.logOut().subscribe(() => {
									localStorage.setItem(environment.session_token, "");
									this.sessionCacheSrv.setSessionData({
										showMenuOptions: false,
										userFullName: "",
										userImage: "",
										invitationsQtt: 0
									});
									this.router.navigateByUrl("/");
									Swal.close();
								});
							});
						}, (error) => {
							Swal.fire({
								title: "Error",
								text: "Sucedió un error al intentar cerrar su cuenta",
								icon: "error",
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: "animated fadeInUp",
								},
							});
						});
				}
			});
		} catch (error) {}
	}

	private createFormsGroup() {
		this.credentialsForm = new FormGroup({
		  email: new FormControl('', [Validators.required, Validators.email]),
		  password: new FormControl('', [Validators.required])
		});
	
		this.credentialsForm.setValue({ email: '', password: '' });
	  }
	
}
