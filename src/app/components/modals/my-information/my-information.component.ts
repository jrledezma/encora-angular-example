import { Component, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

import {
	FormBuilder,
	Validators,
	FormControl,
	FormGroup,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import Swal, { SweetAlertResult } from "sweetalert2";
import {
	AuthService,
	ImageCompressorService,
	SessionCacheService,
	UsersService,
} from "src/app/services";
import { ServiceResultInterface } from "src/app/interfaces";
import { countryList, Toast } from "../../../../constant-values";
import { take } from "rxjs/operators";

@Component({
	selector: "app-my-information",
	templateUrl: "./my-information.component.html",
	styles: [],
})
export class MyInformationComponent implements OnInit {
	registerUserForm: FormGroup;
	invalidPassword = false;
	countryList = countryList;
	userImageFile: any;
	userImage = "https://absque-public-stuff.s3.amazonaws.com/clifoll/user_icon.png";

	private toast = Toast;
	private userId = "";

	constructor(
		public activeModal: NgbActiveModal,
		private activeRoute: ActivatedRoute,
		private router: Router,
		private formBuilder: FormBuilder,
		private authSrv: AuthService,
		private imageCompressorSrv: ImageCompressorService,
		public sessionCacheSrv: SessionCacheService,
		private usersSrv: UsersService
	) {}

	ngOnInit() {
		try {
			this.createFormGroup();

			Swal.fire({
				title: "Cargando Datos",
				text: "Cargando datos, por favor espere",
				icon: "info",
				allowEscapeKey: false,
				allowOutsideClick: false,
				allowEnterKey: false,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
			Swal.showLoading();
			this.usersSrv
				.getMyInfo()
				.subscribe((observer: ServiceResultInterface) => {
					Swal.close();
					if (observer.code !== "success") {
						return Swal.fire({
							title: "Error",
							text: "Sucedió un error al tratar de obtener los datos",
							icon: "error",
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: "animate fadeInUp",
							},
						});
					}
					this.userId = observer.detail._id;
					this.userImage = observer.detail.image || "https://absque-public-stuff.s3.amazonaws.com/clifoll/user_icon.png";
					this.registerUserForm.controls.firstName.setValue(
						observer.detail.firstName
					);
					this.registerUserForm.controls.lastName.setValue(
						observer.detail.lastName
					);
					this.registerUserForm.controls.email.setValue(observer.detail.email);
					if (observer.detail.countryCode) {
						this.registerUserForm.controls.countryCode.setValue(
							observer.detail.countryCode
						);
					}
					if (observer.detail.phoneNumber) {
						this.registerUserForm.controls.phoneNumber.setValue(
							observer.detail.phoneNumber || null
						);
					}
					this.registerUserForm.controls.about.setValue(
						observer.detail.about || null
					);
				});
		} catch (error) {
			Swal.close();
			this.toast.fire({
				icon: "error",
				html: '<h6 class="ml-3 mt-1">Sucedió un error al obtener sus datos.</h6>',
			});
		}
	}

	onSelect(event) {
		if ((event.target.files as any[]).length) {
			let reader = new FileReader();
			reader.readAsDataURL(event.target.files[0]);
			reader.onload = (loadResult) => {
				this.userImage = (loadResult.target as any).result.toString();
			};
			this.imageCompressorSrv
				.compress(event.target.files[0], 600)
				.pipe(take(1))
				.subscribe((newimage) => {
					this.userImageFile = newimage;
				});
		}
	}

	modifyData() {
		try {
			Swal.fire({
				title: "Modificar Datos",
				text: "¿Desea modificar sus datos personales?",
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
						title: "Modificando Información",
						text: "Por favor espere mientras se modifica su información",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();
					this.usersSrv.modify(this.createFormData()).subscribe(
						(observer: ServiceResultInterface) => {
							if (observer.code !== "success") {
								Swal.fire({
									title: "Error al Modificar los Datos",
									text: observer.detail,
									icon: "error",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animate fadeInUp",
									},
								});
							}
							this.sessionCacheSrv.setSessionData({
								showMenuOptions: true,
								userFullName: `${this.registerUserForm.controls.firstName.value} ${this.registerUserForm.controls.lastName.value}`,
								userImage: this.userImage,
								invitationsQtt: 0,
							});
							Swal.close();
							this.toast.fire({
								icon: "info",
								html: '<h6 class="ml-3 mt-1">Datos modificados con éxito</h6>',
							});
							return;
						},
						(error: any) => {
							if (error.error.code === "notDataFound") {
								Swal.fire({
									title: "Datos no validos",
									text: "No es posible modificar sus usuario",
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
								title: "Error al Modificar el Usuario",
								text: "Sucedió un error al tratar de modificar sus datos",
								icon: "error",
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: "animate fadeInUp",
								},
							});
						}
					);
				}
			});
		} catch (ex) {
			Swal.fire({
				title: "Error",
				text: "Error al tratar de registrar el usuario.\n".concat(ex.message),
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
		this.registerUserForm = this.formBuilder.group({
			firstName: new FormControl("", [Validators.required]),
			lastName: new FormControl("", [Validators.required]),
			email: new FormControl("", [Validators.required, Validators.email]),
			countryCode: new FormControl("", [Validators.required]),
			phoneNumber: new FormControl(""),
			about: new FormControl(""),
		});

		this.registerUserForm.setValue({
			firstName: "",
			lastName: "",
			email: "",
			countryCode: "",
			phoneNumber: "",
			about: "",
		});
	}

	private createFormData(): FormData {
		const formData = new FormData();
		formData.append(
			"firstName",
			this.registerUserForm.controls["firstName"].value.toString()
		);
		formData.append(
			"lastName",
			this.registerUserForm.controls["lastName"].value.toString()
		);
		formData.append(
			"countryCode",
			this.registerUserForm.controls["countryCode"].value.toString()
		);
		formData.append(
			"phoneNumber",
			this.registerUserForm.controls["phoneNumber"].value.toString()
		);
		formData.append("about", this.registerUserForm.controls["about"].value);

		if (this.userImageFile) {
			formData.append(
				"files",
				this.userImageFile,
				`${this.userId}.img.${(this.userImageFile as File).type.split("/")[1]}`
			);
		} else {
			formData.append("image", this.userImage);
		}

		return formData;
	}
}
