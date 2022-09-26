import { Component, OnInit } from "@angular/core";
import { FormGroup, Validators, FormControl } from "@angular/forms";

import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { SessionCacheService, AuthService } from "../../services";

import * as ConstValues from "../../../constant-values";

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
	showWorkingSpace = false;
	signUpForm: FormGroup;
  showReadMore = true;

	private toast = ConstValues.Toast;

	constructor(
		public sessionCacheSrv: SessionCacheService,
		private authSrv: AuthService
	) {}

	ngOnInit() {
		this.sessionCacheSrv.getSessionData().subscribe((observer) => {
			this.showWorkingSpace = observer.showMenuOptions;
		});

		const sessionToken = localStorage.getItem(environment.session_token);
		if (sessionToken) {
			this.showWorkingSpace = true;
		} else {
			this.showWorkingSpace = false;
		}
		this.signUpForm = new FormGroup({
			email: new FormControl("", [Validators.required, Validators.email]),
		});
		this.signUpForm.setValue({ email: "" });
	}

	signUp() {
		try {
			Swal.fire({
				title: "Enviando Invitación",
				html: `Estamos preparando tu invitación.<br>por favor espera un momento más.`,
				icon: "info",
				allowEscapeKey: false,
				allowOutsideClick: false,
				allowEnterKey: false,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
			this.authSrv.signUp(this.signUpForm.controls.email.value).subscribe(
				(observer) => {
					switch (observer.code) {
						case "error":
							this.toast.fire({
								icon: "error",
								text: `Error al solicitar tu invitación`,
							});
							break;
						case "emailAlreadyExists":
							Swal.fire({
								title: "Correo Electrónico ya Registrado",
								html: `<p>El correo electrónico <span class="text-orange">{this.signUpForm.controls.email.value}</span>$ se encuentra registrado en Clifoll</p>`,
								icon: "info",
								showClass: {
									popup: "animate fadeInUp",
								},
							});
							break;
						case "success":
							Swal.fire({
								title: "Invitación Enviada!",
								html: `<p>Hemos enviado la invitación a la dirección de correo electrónico <span class="text-dark-green">${this.signUpForm.controls.email.value}</span>.</p><p>Gracias por registrarte en Clifoll.com</p>`,
								icon: "info",
								showClass: {
									popup: "animate fadeInUp",
								},
							});
							break;
					}
				},
				(error) => {
          Swal.close();
					if (error.error && error.error.code) {
						switch (error.error.code) {
							case "error":
								this.toast.fire({
									icon: "error",
									text: `Error al solicitar tu invitación`,
								});
								break;
							case "emailAlreadyExists":
								Swal.fire({
									title: "Correo Electrónico Registrado",
									html: `El correo electrónico <span class="text-orange">${this.signUpForm.controls.email.value}</span> se encuentra registrado en Clifoll`,
									icon: "warning",
									showClass: {
										popup: "animate fadeInUp",
									},
								});
								break;
						}
            return;
					}
					this.toast.fire({
						icon: "error",
						text: `Error al solicitar tu invitación.`,
					});
				}
			);
		} catch (error) {
      Swal.close();
			this.toast.fire({
				icon: "error",
				text: `Error al solicitar tu invitación.\n ${error}`,
			});
		}
	}
}
