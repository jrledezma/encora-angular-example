import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";

import Swal, { SweetAlertResult } from "sweetalert2";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {
	FormBuilder,
	Validators,
	FormControl,
	FormGroup,
} from "@angular/forms";

import * as ConstValues from "../../../../constant-values";

import { PasswordValidator } from "src/app/validators/password.validator";
import { AuthService } from "../../../services/auth.service";
import { ServiceResultInterface } from "src/app/interfaces";

@Component({
	selector: "app-change-password",
	templateUrl: "./change-password.component.html",
	styles: [],
})
export class ChangePasswordComponent implements OnInit {
	passwordForm: FormGroup;
	invalidPassword = false;

	private toast = ConstValues.Toast;

	constructor(
		public activeModal: NgbActiveModal,
		private formBuilder: FormBuilder,
		private authSrv: AuthService,
		private location: Location
	) {
		this.location.subscribe((location) => {
			// ...close popup
			this.activeModal.close();
		});
	}

	ngOnInit() {
		this.createFormGroup();
	}

	changePassword() {
		try {
			Swal.fire({
				title: "Cambiar Contraseña",
				text: "Desea cambiar la contraseña?",
				icon: "question",
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Cambiar",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showClass: {
					popup: "animate fadeInUp",
				},
			}).then((result: SweetAlertResult) => {
				if (result.value) {
					Swal.fire({
						title: "Cambiando Password",
						text: "Por favor espere, se esta cambiando su password",
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
						.changePassword(
							this.passwordForm.controls["currentPassword"].value,
							this.passwordForm.controls["password"].value
						)
						.subscribe(
							(observer: ServiceResultInterface) => {
								Swal.close();
								if (observer.code !== "success") {
									if (observer.code === "passwordNotMatch") {
										Swal.fire({
											title: "Error",
											text: `La contraseña no es correcta`,
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
										title: "Error",
										text: `Error al cambiar la contraseña.${observer.detail}`,
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
									title: "Contraseña Modificada",
									text: `La contraseña fue modificada correctamente`,
									icon: "info",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animate tada",
									},
								}).then(() => {
									this.activeModal.close();
								});
							},
							(error: any) => {
								/*
								if (error === "unauthorized") {
									this.toast.fire({
										icon: "error",
										html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
									});
									return;
								}
								*/
								Swal.close();
								if (error.error.code === "passwordNotMatch") {
									Swal.fire({
										title: "Error",
										text: "El password actual no es correcto",
										icon: "error",
										allowOutsideClick: false,
										allowEscapeKey: true,
										showClass: {
											popup: "animate fadeInUp",
										},
									});
								}
							}
						);
				}
			});
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
				currentPassword: new FormControl("", [
					Validators.required,
					Validators.maxLength(18),
				]),
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

		this.passwordForm.setValue({
			currentPassword: "",
			password: "",
			confirmPassword: "",
		});
	}
}
