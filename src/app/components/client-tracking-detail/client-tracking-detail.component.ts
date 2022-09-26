import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import { timer } from 'rxjs';

import Swal from 'sweetalert2';
import * as ConstValues from '../../../constant-values';

import {
	ClientCommunicationWayInterface,
	ServiceResultInterface,
	UserInterface,
} from 'src/app/interfaces';
import {
	ClientCommunicationsTrackingService,
	ClientCommunicationWaysService,
	SessionCacheService,
	UsersService,
	ConfigValuesService,
	ImageCompressorService,
} from '../../services';
import { ClientCommunicationTrackingModalComponent } from '../client-communications-tracking/client-communication-tracking-modal.component';
import { ClientsService } from '../../services/clients.service';
import { ClientCommunicationTrackingCommentsService } from 'src/app/services/client-communication-tracking-comments.service';
import { UserInfoDetailComponent } from '../modals/user-info-detail/user-info-detail.component';
import { environment } from '../../../environments/environment';
import { take } from 'rxjs/operators';
import { ImageModalComponent } from '../modals/image-modal/image-modal.component';
var moment = require('moment');

@Component({
	selector: 'app-client-tracking-detail',
	templateUrl: './client-tracking-detail.component.html',
	styles: [],
})
export class ClientTrackingDetailComponent implements OnInit {
	trackingForm: FormGroup;
	userSearchForm: FormGroup;
	clientTrackingDetail: any = {};
	clientCommunicationsCollection: any[] = [];
	clientNotesCollection: any[] = [];
	waysOfEntriesCollection: ClientCommunicationWayInterface[] = [];
	trackingId: string = '';
	gotCommunications: boolean = false;
	gotNotes: boolean = false;
	userRole = '';
	trackingComments: any = [];
	clientContacts: any = [];
	communicationWaysCollection: any = [];
	availableUsers: any = [];
	stakeholders: any[] = [];
	existingUsers: string[] = [];
	trackingData: any = {};
	showSaveButton = false;
	showClientContact = true;
	canAddStakeholder = true;
	showUserSearchResult = false;
	showInviteUserMessage = false;
	showSearchingMessage = false;
	showRecordAudio = true;
	showImagesControls = true;
	mouseHoverSearchResult = false;
	searchUserSubscriptions: any[] = [];
	canRemoveStakeholders = false;
	userStatus: any = {};
	maxSelectableDate = moment().utcOffset(0, true).format().split('T')[0];
	// pagination
	changeLogPaginationOpt: any = {};
	stakeholdersPaginationOpt: any = {};
	peopleToInvite: { _id?: string; email: string }[] = [];
	//audio recording
	recordAudio: any;
	audioFile: any;
	isRecordingAudio = false;
	audioUrl = '';
	timerSubscription: any;
	audioHasError = false;
	audioTimeElapsed = 0;
	audioMaxTimeAllowed = environment.audioMaxTimeAllowed;
	//images
	uploadedFiles: any[] = [];
	rawUploadedFiles: any[] = [];

	private toast = ConstValues.Toast;
	private stakeholdersToRevokeInvitations: any[] = [];
	private sendingCommentsStatus = {
		none: 'none',
		sending: 'sending',
		error: 'error',
	};

	constructor(
		private modalService: NgbModal,
		private clientTrackingSrv: ClientCommunicationsTrackingService,
		private trackingCommentsSrv: ClientCommunicationTrackingCommentsService,
		private clientSrv: ClientsService,
		private usersSrv: UsersService,
		private communicationWaysSrv: ClientCommunicationWaysService,
		private sessionCacheSrv: SessionCacheService,
		private route: ActivatedRoute,
		private configValuesSrv: ConfigValuesService,
		private router: Router,
		private domSanitizer: DomSanitizer,
		private changeDetector: ChangeDetectorRef,
		private imageCompressorSrv: ImageCompressorService
	) {
		this.sessionCacheSrv.getSessionData().subscribe((observer: any) => {});
	}

	ngOnInit() {
		this.configValuesSrv.getUserStatus().subscribe((observer: ServiceResultInterface) => {
			if (observer.code === 'success') {
				this.userStatus = observer.detail;
			}
		});
		this.createFormGroup();
		const paginationOptions = {
			currentPage: 1,
			itemsPerPage: 4,
			maxSize: 5,
			directionLinks: true,
			autoHide: true,
			responsive: true,
			previousLabel: 'Anterior',
			nextLabel: 'Siguiente',
		};
		this.getUsers();
		this.getClientCommunicationWay();

		this.changeLogPaginationOpt = { ...paginationOptions };
		this.stakeholdersPaginationOpt = { ...paginationOptions };
		this.route.paramMap.subscribe((params) => {
			this.trackingId = params.get('trackingId');
			this.getTrackingCommunicationData();
		});

		this.userSearchForm.get('filter').valueChanges.subscribe((val) => {
			this.searchUsers(val);
		});
	}

	ngAfterViewChecked() {
		this.changeDetector.detectChanges();
	}

	startRecording() {
		try {
			this.audioHasError = false;
			this.isRecordingAudio = true;
			let mediaConstraints = {
				video: false,
				audio: true,
			};
			navigator.mediaDevices
				.getUserMedia(mediaConstraints)
				.then(this.successCallback.bind(this), this.errorCallback.bind(this));
		} catch (ex) {
			this.isRecordingAudio = false;
			this.audioTimeElapsed = 0;
			this.timerSubscription.unsubscribe();
			this.audioUrl = '';
			this.toast.fire({
				icon: 'error',
				text: `No es posible grabar la nota de audio.`,
			});
		}
	}

	/**
	 * Will be called automatically.
	 */
	successCallback(stream) {
		var options = {
			type: 'audio',
			mimeType: 'audio/wav',
			recorderType: RecordRTC.StereoAudioRecorder,
			numberOfAudioChannels: 1,
			desiredSampRate: 16000,
		};
		//Start Actuall Recording
		var stereoAudioRecorder = RecordRTC.StereoAudioRecorder;
		this.recordAudio = new stereoAudioRecorder(stream, options);
		this.recordAudio.record();
		this.audioUrl = '';
		this.startTimer();
	}

	/**
	 * Stop recording.
	 */
	stopRecording() {
		this.timerSubscription.unsubscribe();
		this.isRecordingAudio = false;
		this.recordAudio.stop(this.processAudioRecording.bind(this));
		this.audioTimeElapsed = 0;
	}

	onSelect(event) {
		if (this.uploadedFiles.length <= 3) {
			Swal.fire({
				title: 'Procesando Imágenes',
				text: 'Por favor espere mientras se procesan las imágenes seleccionadas',
				icon: 'info',
				allowEscapeKey: false,
				allowOutsideClick: false,
				allowEnterKey: false,
				showClass: {
					popup: 'animate fadeInUp',
				},
			});
			Swal.showLoading();
			let uploadedFilesLength = this.uploadedFiles.length;
			const files = (event.target as HTMLInputElement).files;
			if (files.length > 3) {
				Swal.fire({
					title: 'Cargar Imagenes',
					text: 'Solo es posible cargar 3 imagenes por producto',
					icon: 'info',
					allowEscapeKey: false,
					allowOutsideClick: false,
					allowEnterKey: false,
					showClass: {
						popup: 'animate fadeInUp',
					},
				});
				return;
			}
			for (let i = 0; i < 3 - this.uploadedFiles.length; i++) {
				const reader = new FileReader();
				if (files[i]) {
					reader.readAsDataURL(files[i]);
					reader.onload = (loadResult) => {
						this.uploadedFiles.push((loadResult.target as any).result.toString());
						this.imageCompressorSrv
							.compress(event.target.files[i], 1080)
							.pipe(take(1))
							.subscribe((newimage) => {
								this.rawUploadedFiles.push(newimage);
								uploadedFilesLength = uploadedFilesLength++;
							});
					};
				}
			}
			Swal.close();
		}
	}

	removeImage(image: any) {
		Swal.fire({
			title: 'Eliminar Imagen',
			text: '¿Desea eliminar la imágen selecionada?',
			icon: 'question',
			allowOutsideClick: false,
			allowEscapeKey: true,
			showCancelButton: true,
			cancelButtonText: 'Cancelar',
			confirmButtonText: 'Eliminar',
			showClass: {
				popup: 'animated fadeInUp',
			},
		}).then((result) => {
			if (result.value) {
				let imageIndex = 0;
				this.uploadedFiles.forEach((file) => {
					if (file === image) {
						this.uploadedFiles.splice(imageIndex, 1);
						this.rawUploadedFiles.splice(imageIndex, 1);
						return;
					}
					imageIndex++;
				});
				if (this.trackingData && this.trackingData._id) {
					this.trackingData.images = this.trackingData.images.filter(
						(img) => img !== image
					);
				}
			}
		});
	}

	openImageDetailModal(imageUrl: string) {
		const modalRef = this.modalService.open(ImageModalComponent, {
			keyboard: true,
			backdrop: true,
			centered: true,
			size: 'lg',
			windowClass: 'animated fadeIn modal-content-transparent',
		});
		if (imageUrl) {
			modalRef.componentInstance.imageUrl = imageUrl;
		}
	}

	leaveTracking() {
		try {
			Swal.fire({
				title: 'Abandonar Seguimiento',
				text: '¿Deseas dejar de ser parte del Seguimiento actual?',
				icon: 'question',
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: 'Cancelar',
				confirmButtonText: 'Abandonar',
				confirmButtonColor: '#d9534f',
				showClass: {
					popup: 'animated fadeInUp',
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: 'Dejando el Seguimiento',
						text: 'Se está abandonando el Seguimiento, por favor espere',
						icon: 'info',
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: 'animate fadeInUp',
						},
					});
					Swal.showLoading();
					this.clientTrackingSrv.leaveTracking(this.trackingData._id).subscribe(
						(observer) => {
							if (observer.code !== 'success') {
								Swal.fire({
									title: 'Error',
									text: 'Sucedió un error al tratar de abandonar el Seguimiento',
									icon: 'error',
									allowOutsideClick: false,
									showClass: {
										popup: 'animate fadeInUp',
									},
								});
								return;
							}
							Swal.fire({
								title: 'Seguimiento Abandonado',
								text: 'Has dejado de ser parte del Seguimiento',
								icon: 'success',
								confirmButtonText: 'Ok',
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: 'animated tada',
								},
							}).then((result) => {
								this.router.navigateByUrl('/clientstracking');
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
							Swal.fire({
								title: 'Error',
								text: 'Error al intentar modificar los datos.\n',
								icon: 'error',
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: 'animate fadeInUp',
								},
							});
						}
					);
				}
			});
		} catch (error) {
			Swal.fire({
				title: 'Error',
				text: 'Sucedió un error al tratar de abandonar el Seguimiento',
				icon: 'error',
				allowOutsideClick: false,
				showClass: {
					popup: 'animate fadeInUp',
				},
			});
		}
	}

	/**
	 * processRecording Do what ever you want with blob
	 * @param  {any} audioBlob Blog
	 */
	private processAudioRecording(audioBlob: Blob) {
		this.audioFile = audioBlob;
		this.audioUrl = URL.createObjectURL(this.audioFile);
		this.changeDetector.detectChanges();
	}

	private isAudioSizeNotAllowed(bytes: number): boolean {
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes === 0) {
			return null;
		}
		const unitOfMeassure = parseInt(
			Math.floor(Math.log(bytes) / Math.log(1024)).toString(),
			10
		);
		// using this values to know the unit of meassure for the converted bytes
		//["Bytes", "KB", "MB", "GB", "TB"]
		if (unitOfMeassure < 2) {
			return true;
		}
		if (
			Number((bytes / 1024 ** unitOfMeassure).toFixed(1)) >
				environment.audioSizeAllowedInMB &&
			unitOfMeassure >= 2
		) {
			return false;
		}
		return true;
	}

	/**
	 * Process recording audio error.
	 */
	private errorCallback(error) {
		this.audioHasError = true;
	}

	returnPreviousAuto() {
		this.audioUrl = '';
		this.changeDetector.detectChanges();
		this.audioUrl = this.trackingData.voiceMediaUrl;
		this.changeDetector.detectChanges();
		this.audioFile = null;
	}

	sanitize(audioUrl: string) {
		if (this.audioFile) {
			return this.domSanitizer.bypassSecurityTrustUrl(audioUrl);
		}
		return audioUrl;
	}

	onSearchInputBlur() {
		this.showUserSearchResult = false;
	}

	searchUsers(filter) {
		try {
			if (filter.length > 2) {
				this.searchUserSubscriptions.forEach((subscription) => {
					subscription.unsubscribe();
				});
				const searchSubscription = this.usersSrv.search({ email: filter }).subscribe(
					(response: ServiceResultInterface) => {
						if (response.code !== 'success') {
							this.toast.fire({
								icon: 'error',
								text: `Error al obtener la lista de Usuarios.\n ${response.detail}`,
							});
							return;
						}
						this.showUserSearchResult = true;
						if ((response.detail as UserInterface[]).length > 0) {
							this.availableUsers = (response.detail as any[]).map((user) => {
								return {
									_id: user._id,
									image: user.image,
									fullName: `${
										user.firstName ? user.firstName : 'Usuario no Confirmado'
									} ${user.lastName ? user.lastName : ''}`,
									email: user.email,
									added: user.added,
									countryCode: user.countryCode,
									phoneNumber: user.phoneNumber,
									about: user.about,
									status: user.status,
								};
							});
							this.showInviteUserMessage = false;
							this.showSearchingMessage = false;
						} else {
							this.availableUsers = [];
							if (this.userSearchForm.controls.filter.valid) {
								this.showInviteUserMessage = true;
								this.showSearchingMessage = false;
							} else {
								this.showSearchingMessage = true;
								this.showInviteUserMessage = false;
							}
						}
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
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener la lista de Usuarios.\n ${error}`,
						});
					}
				);
				this.searchUserSubscriptions.push(searchSubscription);
			} else {
				this.availableUsers = [];
				this.showUserSearchResult = false;
			}
		} catch (ex) {
			this.toast.fire({
				icon: 'error',
				text: `Error al obtener la lista de Usuarios.\n ${ex.message}`,
			});
		}
	}

	changeLogPaginationPageChange(newPage: number) {
		this.changeLogPaginationOpt.currentPage = newPage;
	}

	stakeholdersPaginationPageChange(newPage: number) {
		this.stakeholdersPaginationOpt.currentPage = newPage;
	}

	sendComment() {
		try {
			this.trackingComments.push({
				_id: '',
				user: {
					fullName: (this.sessionCacheSrv.getCurrentSessionData() as any).userFullName,
					image: (this.sessionCacheSrv.getCurrentSessionData() as any).userImage,
				},
				comments: this.trackingForm.controls.trackingComment.value,
				createdDate: new Date(),
				sendingStatus: this.sendingCommentsStatus.sending,
			});
			this.trackingCommentsSrv
				.create({
					communicationTracking: this.trackingId,
					comments: this.trackingForm.controls.trackingComment.value,
					isActive: true,
				})
				.subscribe(
					(resultData: any) => {
						this.trackingForm.controls.trackingComment.setValue('');
						if (resultData.code === 'success') {
							this.trackingComments[this.trackingComments.length - 1].sendingStatus =
								this.sendingCommentsStatus.none;
						} else {
							this.trackingComments[this.trackingComments.length - 1].sendingStatus =
								this.sendingCommentsStatus.error;
						}
					},
					(error: any) => {
						this.trackingForm.controls.trackingComment.setValue('');
						/*
						if (error === "unauthorized") {
							this.toast.fire({
								icon: "error",
								html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
							});
							return;
						}
						*/
						this.trackingComments[this.trackingComments.length - 1].sendingStatus =
							this.sendingCommentsStatus.error;
					}
				);
		} catch (ex) {
			this.trackingForm.controls.trackingComment.setValue('');
			this.trackingComments[this.trackingComments.length - 1].sendingStatus =
				this.sendingCommentsStatus.error;
		}
	}

	addStakeHolder(selectedUser?: any) {
		const emailToCompare = selectedUser
			? selectedUser.email
			: this.userSearchForm.controls.filter.value;
		const userFound = this.stakeholders.filter((stakeholder) => {
			if (emailToCompare === stakeholder.email) {
				return stakeholder;
			}
		});
		if (userFound.length > 0) {
			this.toast.fire({
				icon: 'error',
				text: `El interesado seleccionado ya fue agregado`,
			});
			return;
		}
		//get user info if the stakeholder was added before
		const readdedStakeholder = this.stakeholdersToRevokeInvitations.filter(
			(stakeholder) => {
				if (stakeholder.email === selectedUser.email) {
					return stakeholder;
				}
			}
		)[0];
		this.stakeholdersToRevokeInvitations = this.stakeholdersToRevokeInvitations.filter(
			(email) => {
				if (email !== selectedUser.email) {
					return email;
				}
			}
		);
		if (!readdedStakeholder) {
			if (!selectedUser) {
				this.peopleToInvite.push({
					email: this.userSearchForm.controls.filter.value,
				});
			} else {
				this.peopleToInvite.push({
					_id: selectedUser._id,
					email: selectedUser.email,
				});
			}
			//create the stakeholder obj
			this.stakeholders.push({
				_id: selectedUser ? selectedUser._id : null,
				fullName: selectedUser ? selectedUser.fullName : 'Usuario no Confirmado',
				email: selectedUser
					? selectedUser.email
					: this.userSearchForm.controls.filter.value,
				image: selectedUser ? selectedUser.image : null,
				status: selectedUser ? selectedUser.status : 'created',
			});
		} else {
			if (!readdedStakeholder.invitationStatus) {
				this.peopleToInvite.push({
					_id: readdedStakeholder._id || null,
					email: readdedStakeholder.email,
				});
			}
			this.stakeholders.push(readdedStakeholder);
		}
		this.showUserSearchResult = false;
		this.userSearchForm.controls.filter.setValue('');
	}

	removeStakeHolder(email: string) {
		//add removed stakeholders to the revoked invitation list
		this.stakeholdersToRevokeInvitations.push(
			this.stakeholders.filter((stakeholder) => {
				if (email === stakeholder.email) {
					return stakeholder;
				}
			})[0]
		);
		//removing from people to stakeholders collection
		this.stakeholders = this.stakeholders.filter((stakeholder) => {
			if (email !== stakeholder.email) {
				return stakeholder;
			}
		});
		//removing from peopleToInvite collection
		this.peopleToInvite = this.peopleToInvite.filter((person) => {
			if (email !== person.email) {
				return person;
			}
		});
		this.trackingData.stakeholders = this.stakeholders;
	}

	modifyRecord() {
		try {
			Swal.fire({
				title: 'Modificar Datos',
				text: 'Desea modificar los datos ingresados?',
				icon: 'question',
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: 'Cancelar',
				confirmButtonText: 'Guardar',
				showClass: {
					popup: 'animated fadeInUp',
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: 'Modificando Datos',
						text: 'Se estan modificando los datos, por favor espere',
						icon: 'info',
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: 'animate fadeInUp',
						},
					});
					Swal.showLoading();
					this.clientTrackingSrv.modify(this.createFormData()).subscribe(
						(resultData: ServiceResultInterface) => {
							if (resultData.code === 'success') {
								Swal.fire({
									title: 'Datos Modificados',
									text: 'Los datos fueron modificados correctamente',
									icon: 'success',
									confirmButtonText: 'Ok',
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: 'animated tada',
									},
								});
							} else {
								Swal.fire({
									title: 'Error',
									text: 'Error al intentar modificar los datos.\n'.concat(
										resultData.detail
									),
									icon: 'error',
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: 'animate fadeInUp',
									},
								});
							}
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
							Swal.fire({
								title: 'Error',
								text: 'Error al intentar modificar los datos.\n',
								icon: 'error',
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: 'animate fadeInUp',
								},
							});
						}
					);
				}
			});
		} catch (ex) {
			Swal.fire({
				title: 'Error',
				text: JSON.stringify(ex),
				icon: 'error',
				allowOutsideClick: false,
				showClass: {
					popup: 'animate fadeInUp',
				},
			});
		}
	}

	openUserInfoDetailModal(selectedUser: any) {
		const modalRef = this.modalService.open(UserInfoDetailComponent, {
			keyboard: false,
			backdrop: false,
			centered: true,
			size: 'lg',
			windowClass: 'animated fadeIn',
		});
		if (selectedUser) {
			modalRef.componentInstance.userInfo = selectedUser;
		}
	}

	private startTimer() {
		const timerObj = timer(0, 1000);
		this.timerSubscription = timerObj.subscribe((secondsCount) => {
			this.audioTimeElapsed = secondsCount + 1;
			if (this.audioTimeElapsed === this.audioMaxTimeAllowed) {
				this.stopRecording();
				this.toast.fire({
					icon: 'warning',
					text: `Las Notas de Audio deben tener un tiempo máximo de ${this.audioMaxTimeAllowed} segundos.`,
				});
			}
			//this.subscribeTimer = this.timeLeft - val;
		});
	}

	private createFormGroup() {
		this.trackingForm = new FormGroup({
			client: new FormControl({ value: '', disabled: true }),
			trackingType: new FormControl({ value: '', disabled: true }),
			clientContact: new FormControl('', [Validators.required]),
			clientContactName: new FormControl({ value: '', disabled: true }),
			clientCommunicationWay: new FormControl('', [Validators.required]),
			communicationDate: new FormControl('', [Validators.required]),
			createdDate: new FormControl({ value: '', disabled: true }),
			selectedUser: new FormControl(''),
			title: new FormControl('', []),
			comments: new FormControl('', [Validators.required]),
			trackingComment: new FormControl({ value: '', disabled: false }),
			canInvitePeople: new FormControl(false),
			canRemoveStakeholders: new FormControl(false),
			canModify: new FormControl(true),
			canSeeClientContactsList: new FormControl(false),
			isArchived: new FormControl(false),
		});
		this.userSearchForm = new FormGroup({
			filter: new FormControl('', [Validators.email]),
		});
	}

	private getClientCommunicationWay() {
		try {
			this.communicationWaysSrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== 'success') {
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener los Medios de Ingreso.\n ${response.detail}`,
						});
						return;
					}
					this.communicationWaysCollection = response.detail;
				},
				(error: any) => {
					if (error === 'unauthorized') {
						this.toast.fire({
							icon: 'error',
							html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
						});
						return;
					}
					this.toast.fire({
						icon: 'error',
						text: `Error al obtener los Medios de Ingreso.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: 'error',
				text: `Error al obtener los Medios de Ingreso.\n ${ex.message}`,
			});
		}
	}

	private getUsers() {
		try {
			this.usersSrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== 'success') {
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener la lista de Usuarios.\n ${response.detail}`,
						});
						return;
					}
					if ((response.detail as any[]).length > 1) {
						this.availableUsers = (response.detail as any[])
							.filter((user) => {
								if (
									(this.sessionCacheSrv.getCurrentSessionData() as any).userFullName !==
									`${user.firstName} ${user.lastName}`
								) {
									return user;
								}
							})
							.map((user) => {
								return {
									_id: user._id,
									fullName: `${user.firstName || 'Usuario'} ${
										user.lastName || 'No Confirmado'
									}`,
									email: user.email,
								};
							});
					}
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
					this.toast.fire({
						icon: 'error',
						text: `Error al obtener la lista de Usuarios.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: 'error',
				text: `Error al obtener la lista de Usuarios.\n ${ex.message}`,
			});
		}
	}

	private getClientContacts() {
		try {
			this.clientSrv.getContacts(this.clientTrackingDetail.client._id).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== 'success') {
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener la lista de Contactos.\n ${response.detail}`,
						});
						return;
					}
					if (response.detail && (response.detail as any[]).length > 0) {
						this.clientContacts = response.detail.map((item) => {
							return {
								idNumber: item.idNumber,
								fullName: `${item.firstName || 'Usuario'} ${
									item.lastName || 'No Confirmado'
								}`,
							};
						});
					}
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
					this.toast.fire({
						icon: 'error',
						text: `Error al obtener la lista de Contactos.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: 'error',
				text: `Error al obtener la lista de Contactos.\n ${ex.message}`,
			});
		}
	}

	private getTrackingCommunicationData() {
		if (this.trackingId) {
			Swal.fire({
				title: 'Cargando Datos',
				text: 'Cargando datos, por favor espere',
				icon: 'info',
				allowEscapeKey: false,
				allowOutsideClick: false,
				allowEnterKey: false,
				showClass: {
					popup: 'animate fadeInUp',
				},
			});
			Swal.showLoading();
			this.clientTrackingSrv.getById(this.trackingId).subscribe(
				(dataResult: ServiceResultInterface) => {
					Swal.close();
					switch (dataResult.code) {
						case 'success':
							this.trackingData = dataResult.detail;
							this.trackingComments = dataResult.detail.trackingComments;
							this.clientTrackingDetail = dataResult.detail;
							this.trackingForm.controls.trackingType.setValue(
								dataResult.detail.trackingType.value
							);
							this.trackingForm.controls.trackingType.disable();
							this.trackingForm.controls.client.setValue(dataResult.detail.client._id);
							this.trackingForm.controls.comments.setValue(dataResult.detail.comments);
							this.trackingForm.controls.createdDate.setValue(
								dataResult.detail.createdDate.toString().slice(0, 10)
							);
							this.stakeholders = dataResult.detail.stakeHolders.map((stakeholder) => ({
								_id: stakeholder._id,
								fullName: `${stakeholder.fullName || 'Usuario no Confirmado'}`,
								email: stakeholder.email,
								image:
									stakeholder.image ||
									'https://absque-public-stuff.s3.amazonaws.com/clifoll/user_icon.png',
								countryCode: stakeholder.countryCode,
								phoneNumber: stakeholder.phoneNumber,
								about: stakeholder.about,
								status: stakeholder.status,
								invitationStatus: stakeholder.invitationStatus,
							}));
							this.userRole = dataResult.detail.userRole;
							this.audioUrl = dataResult.detail.voiceMediaUrl;

							if (dataResult.detail.images && dataResult.detail.images.length) {
								this.uploadedFiles = dataResult.detail.images.map((image) => image);
							}
							this.trackingForm.controls.isArchived.setValue(
								!dataResult.detail.isArchived
							);
							switch (dataResult.detail.userRole) {
								case 'owner':
									this.trackingForm.controls.clientContact.setValue(
										dataResult.detail.clientContact.idNumber
									);
									//set configuration values
									this.trackingForm.controls.canInvitePeople.setValue(
										dataResult.detail.stakeholdersConfiguration
											? dataResult.detail.stakeholdersConfiguration.canInvitePeople
											: false
									);
									this.trackingForm.controls.canRemove;
									this.trackingForm.controls.canRemoveStakeholders.setValue(
										dataResult.detail.stakeholdersConfiguration.canRemoveStakeholders
											? dataResult.detail.stakeholdersConfiguration.canRemoveStakeholders
											: false
									);
									this.trackingForm.controls.canModify.setValue(
										dataResult.detail.stakeholdersConfiguration
											? dataResult.detail.stakeholdersConfiguration.canModify
											: false
									);
									this.trackingForm.controls.canSeeClientContactsList.setValue(
										dataResult.detail.stakeholdersConfiguration
											? dataResult.detail.stakeholdersConfiguration
													.canSeeClientContactsList
											: false
									);
									switch (dataResult.detail.trackingType._id) {
										case '0001':
											this.trackingForm.controls.communicationDate.setValue(
												dataResult.detail.communicationDate.toString().slice(0, 10)
											);
											this.trackingForm.controls.clientCommunicationWay.setValue(
												dataResult.detail.clientCommunicationWay._id
											);
											this.showClientContact = true;
											this.getClientContacts();
											break;
										case '0002':
											this.trackingForm.controls.title.setValue(dataResult.detail.title);
											this.showClientContact = false;
											break;
										case '0003':
											this.trackingForm.controls.title.setValue(dataResult.detail.title);
											this.trackingForm.controls.title.setErrors({
												required: true,
											});
											this.trackingForm.controls.title.setValidators([
												Validators.required,
											]);
											this.trackingForm.controls.comments.setErrors(null);
											this.trackingForm.controls.comments.setValidators(null);

											this.trackingForm.controls.clientContact.setErrors(null);
											this.trackingForm.controls.clientContact.setValidators(null);
											this.trackingForm.controls.clientCommunicationWay.setErrors(null);
											this.trackingForm.controls.clientCommunicationWay.setValidators(
												null
											);
											this.trackingForm.controls.communicationDate.setErrors(null);
											this.trackingForm.controls.communicationDate.setValidators(null);
											this.showClientContact = false;
											break;
									}
									this.showSaveButton = true;
									break;
								case 'stakeholder':
									this.trackingForm.controls.isArchived.disable();
									if (this.trackingData.isArchive) {
										this.setStakeholdersConfiguration({
											canInvitePeople: false,
											canRemoveStakeholders: false,
											canModify: false,
											canSeeClientContactsList: false,
										});
									} else {
										this.setStakeholdersConfiguration(
											dataResult.detail.stakeholdersConfiguration
										);
									}
									this.trackingForm.controls.clientCommunicationWay.disable();
									this.trackingForm.controls.communicationDate.disable();
									//this.trackingForm.controls.title.disable();
									this.canAddStakeholder =
										dataResult.detail.stakeholdersConfiguration.canInvitePeople;
									switch (dataResult.detail.trackingType._id) {
										case '0001':
											//canSeeClientContactsList
											if (
												dataResult.detail.stakeholdersConfiguration
													.canSeeClientContactsList
											) {
												//this.displaySelectedClientContacts(dataResult.detail.clientContact);
												this.trackingForm.controls.clientContact.setValue(
													dataResult.detail.clientContact.idNumber
												);
											}
											this.trackingForm.controls.communicationDate.setValue(
												dataResult.detail.communicationDate.toString().slice(0, 10)
											);
											this.trackingForm.controls.clientContactName.setValue(
												dataResult.detail.clientContact.fullName
											);
											this.trackingForm.controls.clientCommunicationWay.setValue(
												dataResult.detail.clientCommunicationWay._id
											);

											this.getClientContacts();
											break;
										case '0002':
											this.showClientContact = false;
											this.trackingForm.controls.title.setValue(dataResult.detail.title);
											break;
										case '0003':
											this.trackingForm.controls.title.setValue(dataResult.detail.title);
											this.trackingForm.controls.title.setErrors({
												required: true,
											});
											this.trackingForm.controls.title.setValidators([
												Validators.required,
											]);
											this.trackingForm.controls.comments.setErrors(null);
											this.trackingForm.controls.comments.setValidators(null);

											this.trackingForm.controls.clientContact.setErrors(null);
											this.trackingForm.controls.clientContact.setValidators(null);
											this.trackingForm.controls.clientCommunicationWay.setErrors(null);
											this.trackingForm.controls.clientCommunicationWay.setValidators(
												null
											);
											this.trackingForm.controls.communicationDate.setErrors(null);
											this.trackingForm.controls.communicationDate.setValidators(null);
											this.showClientContact = false;
											break;
									}
									break;
							}
							break;
						case 'notDataFound':
							Swal.fire({
								title: 'Datos no Encontrados',
								text: 'Los datos solicitados no se encuentran o no es miembro de la información',
								icon: 'info',
								allowOutsideClick: false,
								allowEscapeKey: true,
								confirmButtonText: 'Cerrar',
								showClass: {
									popup: 'animated fadeInUp',
								},
							}).then((result) => {
								this.router.navigateByUrl('/');
							});
							break;
						case 'error':
							Swal.fire({
								title: 'Error',
								text: 'Sucedió un error a la hora de obtener los datos solictados',
								icon: 'info',
								allowOutsideClick: false,
								allowEscapeKey: true,
								confirmButtonText: 'Cerrar',
								showClass: {
									popup: 'animated fadeInUp',
								},
							}).then((result) => {
								this.router.navigateByUrl('/');
							});
							break;
						default:
							this.router.navigateByUrl('/');
							break;
					}
				},
				(error: any) => {
					Swal.close();
				}
			);
		}
	}

	private setRequiredFields() {
		switch (this.clientTrackingDetail.trackingType._id) {
			case '0001':
				this.trackingForm.controls.clientContact.setErrors({ required: true });
				this.trackingForm.controls.clientContact.setValidators([Validators.required]);
				this.trackingForm.controls.clientCommunicationWay.setErrors({
					required: true,
				});
				this.trackingForm.controls.clientCommunicationWay.setValidators([
					Validators.required,
				]);
				this.trackingForm.controls.communicationDate.setErrors({
					required: true,
				});
				this.trackingForm.controls.communicationDate.setValidators([Validators.required]);
				this.trackingForm.controls.title.setErrors(null);
				this.trackingForm.controls.title.setValidators(null);
				break;
			case '0002':
				this.trackingForm.controls.title.setErrors({ required: true });
				this.trackingForm.controls.title.setValidators([Validators.required]);

				this.trackingForm.controls.clientContact.setErrors(null);
				this.trackingForm.controls.clientContact.setValidators(null);
				this.trackingForm.controls.clientCommunicationWay.setErrors(null);
				this.trackingForm.controls.clientCommunicationWay.setValidators(null);
				this.trackingForm.controls.communicationDate.setErrors(null);
				this.trackingForm.controls.communicationDate.setValidators(null);
				break;
		}
	}

	private setStakeholdersConfiguration(config: any) {
		//canInvitePeople
		if (!config.canInvitePeople) {
			this.canAddStakeholder = false;
			this.showSaveButton = false;
		} else {
			this.canAddStakeholder = true;
			this.showSaveButton = true;
		}
		//canRemoveStakeholders
		if (!config.canRemoveStakeholders) {
			this.canRemoveStakeholders = false;
			this.showSaveButton = false;
		} else {
			this.canRemoveStakeholders = true;
			this.showSaveButton = true;
		}
		//canModify
		this.showImagesControls = config.canModify;
		if (!config.canModify) {
			this.trackingForm.controls.title.disable();
			this.trackingForm.controls.comments.disable();
		}
		if (config.canRemoveStakeholders && !config.canInvitePeople && !config.canModify) {
			this.showSaveButton = true;
		} else if (
			!config.canRemoveStakeholders &&
			config.canInvitePeople &&
			!config.canModify
		) {
			this.showSaveButton = true;
		} else if (
			!config.canRemoveStakeholders &&
			!config.canInvitePeople &&
			config.canModify
		) {
			this.showSaveButton = true;
		} else if (
			config.canRemoveStakeholders &&
			config.canInvitePeople &&
			config.canModify
		) {
			this.showSaveButton = true;
		} else if (
			!config.canRemoveStakeholders &&
			!config.canInvitePeople &&
			!config.canModify
		) {
			this.showSaveButton = false;
		}
	}

	private createFormData(): FormData {
		const formData = new FormData();
		const stakeholderConfiguration = {
			canInvitePeople: this.trackingForm.controls.canInvitePeople.value,
			canRemoveStakeholders: this.trackingForm.controls.canRemoveStakeholders.value,
			canModify: this.trackingForm.controls.canModify.value,
			canSeeClientContactsList: this.trackingForm.controls.canSeeClientContactsList.value,
		};
		if (this.trackingData && this.trackingData._id) {
			formData.append('_id', this.trackingData._id);
		}
		formData.append('trackingType', this.trackingData.trackingType._id);
		formData.append('client', this.trackingForm.controls.client.value.toString());
		formData.append(
			'clientContact',
			this.trackingForm.controls.clientContact.value.toString()
		);
		formData.append(
			'clientCommunicationWay',
			this.trackingForm.controls.clientCommunicationWay.value.toString()
		);
		formData.append('title', this.trackingForm.controls.title.value.toString());
		formData.append('comments', this.trackingForm.controls.comments.value);
		formData.append(
			'communicationDate',
			this.trackingForm.controls.communicationDate.value
		);
		formData.append(
			'stakeholdersConfiguration',
			JSON.stringify(stakeholderConfiguration)
		);
		formData.append(
			'isArchived',
			this.trackingForm.controls.isArchived.value ? '0' : '1'
		);
		formData.append('peopleToInvite', JSON.stringify(this.peopleToInvite));
		if (this.trackingData && this.trackingData._id) {
			formData.append('voiceMediaUrl', this.trackingData.voiceMediaUrl);
			formData.append('images', JSON.stringify(this.trackingData.images));
		}

		if (this.audioFile) {
			formData.append(
				'files',
				this.audioFile,
				`${this.trackingForm.controls.client.value}-${new Date().getUTCDate()}.audio.${
					(this.audioFile as File).type.split('/')[1]
				}`
			);
		}
		if (this.rawUploadedFiles) {
			let imageIndex = 0;
			this.rawUploadedFiles.forEach((uploadedFile) => {
				formData.append(
					'files',
					uploadedFile,
					`${
						this.trackingForm.controls.client.value
					}-${new Date().getTime()}-${imageIndex}.img.${
						(uploadedFile as File).type.split('/')[1]
					}`
				);
				imageIndex++;
			});
		}

		return formData;
	}
}
