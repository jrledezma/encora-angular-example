import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import Swal from 'sweetalert2';

import { PasswordValidator } from 'src/app/validators/password.validator';
import {
	AuthService,
	ImageCompressorService,
	SessionCacheService,
} from 'src/app/services';
import { ServiceResultInterface } from 'src/app/interfaces';
import { environment } from 'src/environments/environment';
import { countryList } from '../../../constant-values';

@Component({
	selector: 'app-user-confirmation',
	templateUrl: './user-confirmation.component.html',
	styles: [],
})
export class UserConfirmationComponent implements OnInit {
	registerUserForm: FormGroup;
	invalidPassword = false;
	countryList = countryList;
	userImageFile: any;
	userImage = 'https://absque-public-stuff.s3.amazonaws.com/clifoll/user_icon.png';
	hiddenControls = false;

	private userId = '';

	constructor(
		private activeRoute: ActivatedRoute,
		private formBuilder: FormBuilder,
		private authSrv: AuthService,
		private imageCompressorSrv: ImageCompressorService,
		public sessionCacheSrv: SessionCacheService,
		public router: Router
	) {}

	ngOnInit() {
		localStorage.setItem(environment.session_token, '');
		this.createFormGroup();
		this.authSrv.logOut().subscribe((observer) => {
			this.sessionCacheSrv.setSessionData({
				showMenuOptions: false,
				userFullName: '',
				userImage: this.userImage,
				invitationsQtt: 0,
			});
		});
		if (this.activeRoute.routeConfig.path.split('/')[0] === 'recoveraccount') {
			this.authSrv
				.verifyRecoverUserToken(this.activeRoute.snapshot.params['token'])
				.subscribe((observer: ServiceResultInterface) => {
					if (observer.code !== 'success') {
						Swal.fire({
							title: 'Solicitud no Valida',
							text: 'La solicitud de recuperación de cuenta no es valida',
							icon: 'error',
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: 'animate fadeInUp',
							},
						}).then(() => {
							this.router.navigateByUrl('/');
						});
						return;
					}
					this.userId = observer.detail._id;
					this.userImage = observer.detail.image;
					this.registerUserForm.controls.firstName.setValue(observer.detail.firstName);
					this.registerUserForm.controls.firstName.disable();
					this.registerUserForm.controls.lastName.setValue(observer.detail.lastName);
					this.registerUserForm.controls.lastName.disable();
					this.registerUserForm.controls.countryCode.setValue(
						observer.detail.countryCode
					);
					this.registerUserForm.controls.countryCode.disable();
					this.registerUserForm.controls.phoneNumber.setValue(
						observer.detail.phoneNumber
					);
					this.registerUserForm.controls.phoneNumber.disable();
					this.registerUserForm.controls.about.disable();
					this.hiddenControls = true;
				});
		} else {
			this.authSrv
				.verifyConfirmUserToken(this.activeRoute.snapshot.params['token'])
				.subscribe((observer: ServiceResultInterface) => {
					if (observer.code !== 'success') {
						Swal.fire({
							title: 'Solicitud no Valida',
							text: 'La solicitud de registro no es valida',
							icon: 'error',
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: 'animate fadeInUp',
							},
						}).then(() => {
							this.router.navigateByUrl('/');
						});
					}
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

	saveData() {
		if (this.hiddenControls) {
			this.recoverClosedUserAccount();
		} else {
			this.registerUser();
		}
	}

	openTermsAndConditions() {
		const url = this.router.createUrlTree(['/termsandconditions']);
		window.open(url.toString(), '_blank');
	}

	private registerUser() {
		try {
			this.authSrv.endUserRegistration(this.createFormData()).subscribe(
				(observer: ServiceResultInterface) => {
					if (observer.code !== 'success') {
						Swal.fire({
							title: 'Error al Finalizar el Registro',
							text: observer.detail,
							icon: 'error',
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: 'animate fadeInUp',
							},
						});
					}
					Swal.fire({
						title: 'Registro Finalizado',
						text: 'Su registro ha finalizado con éxito, por favor ingrese de nuevo',
						icon: 'info',
						allowOutsideClick: false,
						allowEscapeKey: true,
						showClass: {
							popup: 'animate fadeInUp',
						},
					}).then((value) => {
						if (value.value) {
							this.router.navigateByUrl('/');
						}
					});
				},
				(error: any) => {
					if (error.error.code === 'notDataFound') {
						Swal.fire({
							title: 'Datos no validos',
							text: 'No es posible finalzar el registro del usuario',
							icon: 'error',
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: 'animate fadeInUp',
							},
						});
						return;
					}
					Swal.fire({
						title: 'Error al Registrar el Usuario',
						text: 'Sucedió un error al tratar de registrar el usuario',
						icon: 'error',
						allowOutsideClick: false,
						allowEscapeKey: true,
						showClass: {
							popup: 'animate fadeInUp',
						},
					});
				}
			);
		} catch (ex) {
			Swal.fire({
				title: 'Error',
				text: 'Error al tratar de registrar el usuario.\n'.concat(ex.message),
				icon: 'error',
				allowOutsideClick: false,
				allowEscapeKey: true,
				showClass: {
					popup: 'animate fadeInUp',
				},
			});
		}
	}

	private recoverClosedUserAccount() {
		try {
			this.authSrv
				.recoverClosedAccount(
					this.activeRoute.snapshot.params['token'],
					this.registerUserForm.controls.password.value,
					this.registerUserForm.controls.confirmPassword.value
				)
				.subscribe(
					(observer: ServiceResultInterface) => {
						console.log(observer);
						return;
						if (observer.code !== 'success') {
							Swal.fire({
								title: 'Error al tratar de recuperar la cuenta',
								text: observer.detail,
								icon: 'error',
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: 'animate fadeInUp',
								},
							});
						}
						Swal.fire({
							title: 'Registro Finalizado',
							text: 'Su cuenta de usuario ha sido recuperada satisfactoriamente, por favor ingrese de nuevo',
							icon: 'info',
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: 'animate fadeInUp',
							},
						}).then((value) => {
							if (value.value) {
								this.router.navigateByUrl('/');
							}
						});
					},
					(error: any) => {
						if (error.error.detail.code === 'notDataFound') {
							Swal.fire({
								title: 'Datos no validos',
								text: 'No es posible recuperar la cuenta de usuario',
								icon: 'error',
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: 'animate fadeInUp',
								},
							});
							return;
						}
						Swal.fire({
							title: 'Error al Registrar el Usuario',
							text: 'Sucedió un error al tratar de recuperar la cuenta',
							icon: 'error',
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: 'animate fadeInUp',
							},
						});
					}
				);
		} catch (ex) {
			Swal.fire({
				title: 'Error',
				text: 'Error al tratar de recuperar la cuenta.\n'.concat(ex.message),
				icon: 'error',
				allowOutsideClick: false,
				allowEscapeKey: true,
				showClass: {
					popup: 'animate fadeInUp',
				},
			});
		}
	}

	private createFormGroup() {
		this.registerUserForm = this.formBuilder.group(
			{
				firstName: new FormControl('', [Validators.required]),
				lastName: new FormControl('', [Validators.required]),
				countryCode: new FormControl('', [Validators.required]),
				phoneNumber: new FormControl(''),
				about: new FormControl(''),
				password: new FormControl('', [Validators.required, Validators.maxLength(18)]),
				confirmPassword: new FormControl('', [
					Validators.required,
					Validators.maxLength(18),
				]),
				acceptingTermsAndConditions: new FormControl(false, [Validators.required]),
			},
			{
				validators: [
					PasswordValidator.MatchPassword,
					PasswordValidator.ValidatePasswordStrength,
				],
			}
		);

		this.registerUserForm.setValue({
			firstName: '',
			lastName: '',
			countryCode: '',
			phoneNumber: '',
			about: '',
			password: '',
			confirmPassword: '',
			acceptingTermsAndConditions: false,
		});
	}

	private createFormData(): FormData {
		const formData = new FormData();
		formData.append(
			'firstName',
			this.registerUserForm.controls.firstName.value.toString()
		);
		formData.append('lastName', this.registerUserForm.controls.lastName.value.toString());
		formData.append(
			'countryCode',
			this.registerUserForm.controls.countryCode.value.toString()
		);
		formData.append(
			'phoneNumber',
			this.registerUserForm.controls.phoneNumber.value.toString()
		);
		formData.append('about', this.registerUserForm.controls.about.value.toString());
		formData.append('password', this.registerUserForm.controls.password.value.toString());
		formData.append(
			'confirmPassword',
			this.registerUserForm.controls.confirmPassword.value.toString()
		);
		formData.append('registrationToken', this.activeRoute.snapshot.params['token']);

		if (this.userImageFile) {
			formData.append(
				'files',
				this.userImageFile,
				`${this.userId}.img.${(this.userImageFile as File).type.split('/')[1]}`
			);
		} else {
			formData.append('image', this.userImage);
		}

		return formData;
	}
}
