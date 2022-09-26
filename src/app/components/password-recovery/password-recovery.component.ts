import { Component, OnInit } from "@angular/core";
import {
	FormBuilder,
	Validators,
	FormControl,
	FormGroup,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import Swal from "sweetalert2";

import { PasswordValidator } from "src/app/validators/password.validator";
import { AuthService } from "src/app/services";
import { ServiceResultInterface } from "src/app/interfaces";

@Component({
	selector: "app-password-recovery",
	templateUrl: "./password-recovery.component.html",
	styles: [],
})
export class PasswordRecoveryComponent implements OnInit {
	passwordForm: FormGroup;
	invalidPassword = false;

	constructor(
		private activeRoute: ActivatedRoute,
		private router: Router,
		private formBuilder: FormBuilder,
		private authSrv: AuthService
	) {}

	ngOnInit() {
		this.createFormGroup();
		this.authSrv
			.validatePasswordToken(this.activeRoute.snapshot.params["token"])
			.subscribe((observer: ServiceResultInterface) => {
				if (observer.code !== "success") {
					Swal.fire({
						title: "Solicitud no Valida",
						text: "La solicitud de cambio de contraseña ha expirado",
						icon: "error",
						allowOutsideClick: false,
						allowEscapeKey: true,
						showClass: {
							popup: "animate fadeInUp",
						},
					}).then(() => {
						this.router.navigateByUrl("/");
					});
				}
			});
	}

	recoverPassword() {
		try {
			this.authSrv
				.forgotPassword(
					this.passwordForm.controls.password.value,
					this.activeRoute.snapshot.params["token"]
				)
				.subscribe(
					(observer: ServiceResultInterface) => {
						if (observer.code !== "success") {
							Swal.fire({
								title: "Error al Cambiar la Contraseña",
								text: observer.detail,
								icon: "error",
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: "animate fadeInUp",
								},
							});
						}
						Swal.fire({
							title: "Contraseña Cambiada",
							text: "Su contraseña ha sido cambiada, por favor ingresa de nuevo",
							icon: "info",
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: "animate fadeInUp",
							},
						}).then((value) => {
							if (value.value) {
								this.router.navigateByUrl("/");
							}
						});
					},
					(error: any) => {
						if (error.error.code === "emailNotFound") {
							Swal.fire({
								title: "Correo Eléctronico no valido",
								text: "El correo eléctronico ingresado no fue encontrado en la base de datos.",
								icon: "error",
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: "animate fadeInUp",
								},
							});
							return;
						}
						Swal.fire({
							title: "Error al Cambiar la Contraseña",
							text: "Sucedió un error al tratar de cambiar la contraseña",
							icon: "error",
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: "animate fadeInUp",
							},
						});
					}
				);
		} catch (ex) {
			Swal.fire({
				title: "Error",
				text: "Error al cambiar la contraseña.\n".concat(ex.message),
				icon: "error",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
		}
	}

	private createFormGroup() {
		this.passwordForm = this.formBuilder.group(
			{
				password: new FormControl("", [
					Validators.required,
					Validators.maxLength(18),
				]),
				confirmPassword: new FormControl("", [
					Validators.required,
					Validators.maxLength(18),
				]),
			},
			{
				validators: [
					PasswordValidator.MatchPassword,
					PasswordValidator.ValidatePasswordStrength,
				],
			}
		);

		this.passwordForm.setValue({ password: "", confirmPassword: "" });
	}
}
