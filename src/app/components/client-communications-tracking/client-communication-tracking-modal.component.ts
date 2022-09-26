import { Component, OnInit, Input, ChangeDetectorRef } from "@angular/core";
import { Location } from "@angular/common";
import {
	FormGroup,
	FormControl,
	Validators,
	FormBuilder,
} from "@angular/forms";
import { timer } from "rxjs";
import { take } from "rxjs/operators";

import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";
import * as RecordRTC from "recordrtc";
import { DomSanitizer } from "@angular/platform-browser";

import * as ConstValues from "../../../constant-values";
import { ClientCommunicationTrackingCommentsService } from "../../services/client-communication-tracking-comments.service";

import {
	ClientInterface,
	ServiceResultInterface,
	ClientWayOfEntryInterface,
	UserInterface,
	ClientTrackingTypeInterface,
} from "src/app/interfaces";
import {
	ClientsService,
	ClientCommunicationWaysService,
	SessionCacheService,
	ClientCommunicationsTrackingService,
	UsersService,
	ClientTrackingTypesService,
	ConfigValuesService,
	ImageCompressorService,
} from "src/app/services";
import { UserInfoDetailComponent } from "../modals/user-info-detail/user-info-detail.component";
import { environment } from "../../../environments/environment";
import { ImageModalComponent } from "../modals/image-modal/image-modal.component";
var moment = require("moment");

@Component({
	selector: "app-client-communication-tracking-modal",
	templateUrl: "./client-communication-tracking-modal.component.html",
	styles: [],
})
export class ClientCommunicationTrackingModalComponent implements OnInit {
	@Input() dataId: string;
	@Input() clientId: string;
	@Input() communicationType: string;
	trackingForm: FormGroup;
	userSearchForm: FormGroup;
	communicationWaysCollection: ClientWayOfEntryInterface[] = [];
	trackingComments: any[] = [];
	clientsCollection: ClientInterface[] = [];
	productTypeDetailCollection: string[] = [];
	clientContacts: { idNumber: string; fullName: string }[] = [];
	availableUsers: any[] = [];
	stakeholders: any[] = [];
	existingUsers: string[] = [];
	newUsers: string[] = [];
	trackingTypes: ClientTrackingTypeInterface[] = [];
	userRole = "";
	trackingData: any = {};
	canAddStakeholder = true;
	canRemoveStakeholders = true;
	showSaveButton = true;
	showClientContact = false;
	showUserSearchResult = false;
	showInviteUserMessage = false;
	showSearchingMessage = false;
	showImagesControls = true;
	showRecordAudio = true;
	searchUserSubscriptions: any[] = [];
	userStatus: any = {};
	maxSelectableDate = moment().utcOffset(0, true).format().split("T")[0];
	peopleToInvite: { _id?: string; email: string }[] = [];
	// pagination
	changeLogPaginationOpt: any = {};
	stakeholdersPaginationOpt: any = {};
	//audio recording
	recordAudio: any;
	audioFile: any;
	isRecordingAudio = false;
	audioUrl = "";
	audioHasError = false;
	timerSubscription: any;
	audioTimeElapsed = 0;
	audioMaxTimeAllowed = environment.audioMaxTimeAllowed;
	//images
	uploadedFiles: any[] = [];
	rawUploadedFiles: any[] = [];

	private toast = ConstValues.Toast;
	private sendingCommentsStatus = {
		none: "none",
		sending: "sending",
		error: "error",
	};
	private stakeholdersToRevokeInvitations: any[] = [];

	constructor(
		public activeModal: NgbActiveModal,
		private modalService: NgbModal,
		private clientsSrv: ClientsService,
		private usersSrv: UsersService,
		private communicationWaysSrv: ClientCommunicationWaysService,
		private sessionCacheSrv: SessionCacheService,
		private clientTrackingSrv: ClientCommunicationsTrackingService,
		private trackingCommentsSrv: ClientCommunicationTrackingCommentsService,
		private trackingTypeSrv: ClientTrackingTypesService,
		private configValuesSrv: ConfigValuesService,
		private location: Location,
		private domSanitizer: DomSanitizer,
		private changeDetector: ChangeDetectorRef,
		private imageCompressorSrv: ImageCompressorService
	) {
		this.createFormObject(false);
		this.location.subscribe((location) => {
			// ...close popup
			this.activeModal.close();
		});
	}

	ngOnInit() {
		this.configValuesSrv
			.getUserStatus()
			.subscribe((observer: ServiceResultInterface) => {
				if (observer.code === "success") {
					this.userStatus = observer.detail;
				}
			});
		const paginationOptions = {
			currentPage: 1,
			itemsPerPage: 4,
			maxSize: 5,
			directionLinks: true,
			autoHide: true,
			responsive: true,
			previousLabel: "Anterior",
			nextLabel: "Siguiente",
		};
		this.changeLogPaginationOpt = { ...paginationOptions };
		this.stakeholdersPaginationOpt = { ...paginationOptions };

		this.createFormGroup();
		this.getTrackingTypes();
		this.getClients();
		this.getClientCommunicationWay();
		this.getTrackingCommunicationData();

		this.userSearchForm.get("filter").valueChanges.subscribe((val) => {
			this.searchUsers(val);
		});
		this.trackingForm.controls.trackingType.setValue(this.communicationType);
	}

	ngAfterViewChecked() {
		this.changeDetector.detectChanges();
	}

	/*
		Audio Recording
	*/

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
			this.audioUrl = "";
			this.toast.fire({
				icon: "error",
				text: `No es posible grabar la nota de audio.`,
			});
		}
	}

	/**
	 * Will be called automatically.
	 */
	successCallback(stream) {
		var options = {
			/*mimeType: "audio/wav",
			numberOfAudioChannels: 1,
			sampleRate: 44000,*/
			type: "audio",
			mimeType: "audio/wav",
			recorderType: RecordRTC.StereoAudioRecorder,
			numberOfAudioChannels: 1,
			desiredSampRate: 16000,
		};
		//Start Actuall Recording
		var stereoAudioRecorder = RecordRTC.StereoAudioRecorder;
		this.recordAudio = new stereoAudioRecorder(stream, options);
		this.recordAudio.record();
		this.audioUrl = "";
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

	returnPreviousAuto() {
		this.audioUrl = "";
		this.changeDetector.detectChanges();
		this.audioUrl = this.trackingData.voiceMediaUrl;
		this.changeDetector.detectChanges();
		this.audioFile = null;
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
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
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

	private startTimer() {
		const timerObj = timer(0, 1000);
		this.timerSubscription = timerObj.subscribe((secondsCount) => {
			this.audioTimeElapsed = secondsCount + 1;
			if (this.audioTimeElapsed === this.audioMaxTimeAllowed) {
				this.stopRecording();
				this.toast.fire({
					icon: "warning",
					text: `Las Notas de Audio deben tener un tiempo máximo de ${this.audioMaxTimeAllowed} segundos.`,
				});
			}
			//this.subscribeTimer = this.timeLeft - val;
		});
	}

	/**
	 * Process recording audio error.
	 */
	private errorCallback(error) {
		this.audioHasError = true;
	}

	/*
		EO Audio Recording
	*/

	onSelect(event) {
		if (this.uploadedFiles.length <= 3) {
			Swal.fire({
				title: "Procesando Imágenes",
				text: "Por favor espere mientras se procesan las imágenes seleccionadas",
				icon: "info",
				allowEscapeKey: false,
				allowOutsideClick: false,
				allowEnterKey: false,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
			Swal.showLoading();
			let uploadedFilesLength = this.uploadedFiles.length;
			const files = (event.target as HTMLInputElement).files;
			if (files.length > 3) {
				Swal.fire({
					title: "Cargar Imagenes",
					text: "Solo es posible cargar 3 imagenes por producto",
					icon: "info",
					allowEscapeKey: false,
					allowOutsideClick: false,
					allowEnterKey: false,
					showClass: {
						popup: "animate fadeInUp",
					},
				});
				return;
			}
			for (let i = 0; i < 3 - this.uploadedFiles.length; i++) {
				const reader = new FileReader();
				if (files[i]) {
					reader.readAsDataURL(files[i]);
					reader.onload = (loadResult) => {
						this.uploadedFiles.push(
							(loadResult.target as any).result.toString()
						);
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
			title: "Eliminar Imagen",
			text: "¿Desea eliminar la imágen selecionada?",
			icon: "question",
			allowOutsideClick: false,
			allowEscapeKey: true,
			showCancelButton: true,
			cancelButtonText: "Cancelar",
			confirmButtonText: "Eliminar",
			showClass: {
				popup: "animated fadeInUp",
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

	sanitize(audioUrl: string) {
		if (audioUrl) {
			return this.domSanitizer.bypassSecurityTrustUrl(audioUrl);
		}
		return null;
	}

	changeLogPaginationPageChange(newPage: number) {
		this.changeLogPaginationOpt.currentPage = newPage;
	}

	stakeholdersPaginationPageChange(newPage: number) {
		this.stakeholdersPaginationOpt.currentPage = newPage;
	}

	searchUsers(filter) {
		try {
			if (filter.length > 2) {
				this.availableUsers = [];
				this.searchUserSubscriptions.forEach((subscription) => {
					subscription.unsubscribe();
				});
				const searchSubscription = this.usersSrv
					.search({ email: filter })
					.subscribe(
						(response: ServiceResultInterface) => {
							if (response.code !== "success") {
								this.toast.fire({
									icon: "error",
									text: `Error al obtener la lista de Usuarios.\n ${response.detail}`,
								});
								return;
							}
							this.showUserSearchResult = true;
							if ((response.detail as UserInterface[]).length > 0) {
								this.availableUsers = (response.detail as UserInterface[])
									.filter((user) => {
										let stakeholderFound = false;
										this.stakeholders.forEach((stakeholder) => {
											if (user._id === stakeholder._id) {
												stakeholderFound = true;
											}
										});
										if (!stakeholderFound) {
											return { ...user, isSelected: true };
										}
										return { ...user, isSelected: false };
									})
									.map((user) => {
										return {
											_id: user._id,
											image: user.image,
											fullName: `${user.firstName} ${user.lastName}`,
											email: user.email,
											countryCode: user.countryCode,
											phoneNumber: user.phoneNumber,
											about: user.about,
											status: user.status,
										};
									});
								this.showInviteUserMessage = false;
								this.showSearchingMessage = false;
							} else if (this.userSearchForm.controls.filter.valid) {
								this.showInviteUserMessage = true;
								this.showSearchingMessage = false;
							} else {
								this.showSearchingMessage = true;
								this.showInviteUserMessage = false;
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
								icon: "error",
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
				icon: "error",
				text: `Error al obtener la lista de Usuarios.\n ${ex.message}`,
			});
		}
	}

	save() {
		if (!this.dataId) {
			this.createRecord();
		} else {
			this.modifyRecord();
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
				icon: "error",
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
		this.stakeholdersToRevokeInvitations =
			this.stakeholdersToRevokeInvitations.filter((email) => {
				if (email !== selectedUser.email) {
					return email;
				}
			});
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
				fullName: selectedUser
					? selectedUser.fullName
					: "Usuario no Confirmado",
				email: selectedUser
					? selectedUser.email
					: this.userSearchForm.controls.filter.value,
				image: selectedUser ? selectedUser.image : null,
				status: selectedUser ? selectedUser.status : "created",
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
		this.userSearchForm.controls.filter.setValue("");
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

	displaySelectedClientContacts(selectedClient: any) {
		if (selectedClient) {
			if (selectedClient._id !== this.trackingForm.controls.client.value) {
				this.trackingForm.controls.clientContact.setValue(null);
			}
			this.clientsCollection.forEach((client) => {
				if (selectedClient._id === client._id) {
					this.clientContacts = client.contacts.map((contact) => {
						return {
							idNumber: contact.idNumber,
							fullName: `${contact.firstName} ${contact.lastName}`,
						};
					});
					return;
				}
			});
			if (this.clientContacts || this.clientContacts.length) {
				this.trackingForm.controls.clientContact.enable();
			}
		}
	}

	setRequiredFields(selectedValue: any) {
		switch (selectedValue._id) {
			case "0001":
				this.trackingForm.controls.clientContact.setErrors({ required: true });
				this.trackingForm.controls.clientContact.setValidators([
					Validators.required,
				]);
				this.trackingForm.controls.clientCommunicationWay.setErrors({
					required: true,
				});
				this.trackingForm.controls.clientCommunicationWay.setValidators([
					Validators.required,
				]);
				this.trackingForm.controls.communicationDate.setErrors({
					required: true,
				});
				this.trackingForm.controls.communicationDate.setValidators([
					Validators.required,
				]);
				this.trackingForm.controls.title.setErrors(null);
				this.trackingForm.controls.title.setValidators(null);
				this.showClientContact = true;
				break;
			case "0002":
				this.trackingForm.controls.title.setErrors({ required: true });
				this.trackingForm.controls.title.setValidators([Validators.required]);

				this.trackingForm.controls.clientContact.setErrors(null);
				this.trackingForm.controls.clientContact.setValidators(null);
				this.trackingForm.controls.clientCommunicationWay.setErrors(null);
				this.trackingForm.controls.clientCommunicationWay.setValidators(null);
				this.trackingForm.controls.communicationDate.setErrors(null);
				this.trackingForm.controls.communicationDate.setValidators(null);
				this.showClientContact = false;
				break;
			case "0003":
				this.trackingForm.controls.title.setErrors({ required: true });
				this.trackingForm.controls.title.setValidators([Validators.required]);
				this.trackingForm.controls.comments.setErrors(null);
				this.trackingForm.controls.comments.setValidators(null);

				this.trackingForm.controls.clientContact.setErrors(null);
				this.trackingForm.controls.clientContact.setValidators(null);
				this.trackingForm.controls.clientCommunicationWay.setErrors(null);
				this.trackingForm.controls.clientCommunicationWay.setValidators(null);
				this.trackingForm.controls.communicationDate.setErrors(null);
				this.trackingForm.controls.communicationDate.setValidators(null);
				this.showClientContact = false;
				break;
		}
	}

	sendComment() {
		try {
			this.trackingComments.push({
				_id: "",
				user: {
					fullName: (this.sessionCacheSrv.getCurrentSessionData() as any)
						.userFullName,
					image: (this.sessionCacheSrv.getCurrentSessionData() as any)
						.userImage,
				},
				comments: this.trackingForm.controls.trackingComments.value,
				createdDate: new Date(),
				sendingStatus: this.sendingCommentsStatus.sending,
			});
			this.trackingCommentsSrv
				.create({
					communicationTracking: this.dataId,
					comments: this.trackingForm.controls.trackingComments.value,
					isActive: true,
				})
				.subscribe(
					(resultData: any) => {
						this.trackingForm.controls.trackingComments.setValue("");
						if (resultData.code === "success") {
							this.trackingComments[
								this.trackingComments.length - 1
							].sendingStatus = this.sendingCommentsStatus.none;
						} else {
							this.trackingComments[
								this.trackingComments.length - 1
							].sendingStatus = this.sendingCommentsStatus.error;
						}
					},
					(error: any) => {
						this.trackingForm.controls.trackingComments.setValue("");
						/*
						if (error === "unauthorized") {
							this.toast.fire({
								icon: "error",
								html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
							});
							return;
						}
						*/
						this.trackingComments[
							this.trackingComments.length - 1
						].sendingStatus = this.sendingCommentsStatus.error;
					}
				);
		} catch (ex) {
			this.trackingForm.controls.trackingComments.setValue("");
			this.trackingComments[this.trackingComments.length - 1].sendingStatus =
				this.sendingCommentsStatus.error;
		}
	}

	openUserInfoDetailModal(selectedUser: any) {
		const modalRef = this.modalService.open(UserInfoDetailComponent, {
			keyboard: false,
			backdrop: false,
			centered: true,
			size: "lg",
			windowClass: "animated fadeIn",
		});
		if (selectedUser) {
			modalRef.componentInstance.userInfo = selectedUser;
		}
	}

	openImageDetailModal(imageUrl: string) {
		const modalRef = this.modalService.open(ImageModalComponent, {
			keyboard: true,
			backdrop: true,
			centered: true,
			size: "lg",
			windowClass: "animated fadeIn modal-content-transparent",
		});
		if (imageUrl) {
			modalRef.componentInstance.imageUrl = imageUrl;
		}
	}

	leaveTracking() {
		try {
			Swal.fire({
				title: "Abandonar Seguimiento",
				text: "¿Deseas dejar de ser parte del Seguimiento actual?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Abandonar",
				confirmButtonColor: "#d9534f",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: "Dejando el Seguimiento",
						text: "Se está abandonando el Seguimiento, por favor espere",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();
					this.clientTrackingSrv.leaveTracking(this.trackingData._id).subscribe(
						(observer) => {
							if (observer.code !== "success") {
								Swal.fire({
									title: "Error",
									text: "Sucedió un error al tratar de abandonar el Seguimiento",
									icon: "error",
									allowOutsideClick: false,
									showClass: {
										popup: "animate fadeInUp",
									},
								});
								return;
							}
							Swal.fire({
								title: "Seguimiento Abandonado",
								text: "Has dejado de ser parte del Seguimiento",
								icon: "success",
								confirmButtonText: "Ok",
								allowOutsideClick: false,
								allowEscapeKey: true,
								showClass: {
									popup: "animated tada",
								},
							}).then((result) => {
								this.activeModal.close(true);
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
								title: "Error",
								text: "Error al intentar modificar los datos.\n",
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
		} catch (error) {
			Swal.fire({
				title: "Error",
				text: "Sucedió un error al tratar de abandonar el Seguimiento",
				icon: "error",
				allowOutsideClick: false,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
		}
	}

	private createFormGroup() {
		this.trackingForm = new FormGroup({
			client: new FormControl("", [Validators.required]),
			clientName: new FormControl({ value: "", disabled: true }),
			trackingType: new FormControl("", [Validators.required]),
			clientContact: new FormControl({ value: "", disabled: true }),
			clientContactName: new FormControl({ value: "", disabled: true }),
			clientCommunicationWay: new FormControl(""),
			communicationDate: new FormControl(""),
			selectedUser: new FormControl(""),
			title: new FormControl(""),
			comments: new FormControl("", [Validators.required]),
			trackingComments: new FormControl(""),
			canInvitePeople: new FormControl(false),
			canRemoveStakeholders: new FormControl(false),
			canModify: new FormControl(true),
			canSeeClientContactsList: new FormControl(false),
			isArchived: new FormControl(false),
		});
		this.createFormObject(true);
		//this.trackingForm.setValue(this.clientData);
		this.userSearchForm = new FormGroup({
			filter: new FormControl("", [Validators.email]),
		});
	}

	private getClientCommunicationWay() {
		try {
			this.communicationWaysSrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== "success") {
						this.toast.fire({
							icon: "error",
							text: `Error al obtener los Medios de Ingreso.\n ${response.detail}`,
						});
						return;
					}
					this.communicationWaysCollection = response.detail;
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
						icon: "error",
						text: `Error al obtener los Medios de Ingreso.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: "error",
				text: `Error al obtener los Medios de Ingreso.\n ${ex.message}`,
			});
		}
	}

	private getClients() {
		try {
			this.clientsSrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== "success") {
						this.toast.fire({
							icon: "error",
							text: `Error al obtener los Clientes.\n ${response.detail}`,
						});
						return;
					}
					this.clientsCollection = response.detail;
					if (this.clientId) {
						this.trackingForm.controls.client.setValue(this.clientId);
						this.trackingForm.controls.client.disable();
						this.displaySelectedClientContacts({ _id: this.clientId });
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
						icon: "error",
						text: `Error al obtener los Clientes.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: "error",
				text: `Error al obtener los Clientes.\n ${ex.message}`,
			});
		}
	}

	private getTrackingTypes() {
		try {
			this.trackingTypeSrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== "success") {
						this.toast.fire({
							icon: "error",
							text: `Error al obtener los Tipos de Seguimiento.\n ${response.detail}`,
						});
						return;
					}
					this.trackingTypes = response.detail;
				},
				(error: any) => {
					/*if (error === "unauthorized") {
						this.toast.fire({
							icon: "error",
							html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
						});
						return;
					}*/
					this.toast.fire({
						icon: "error",
						text: `Error al obtener los Clientes.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: "error",
				text: `Error al obtener los Clientes.\n ${ex.message}`,
			});
		}
	}

	private getTrackingCommunicationData() {
		if (this.dataId) {
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
			this.clientTrackingSrv
				.getById(this.dataId)
				.subscribe((dataResult: ServiceResultInterface) => {
					this.trackingComments = dataResult.detail.trackingComments;
					//tracking types
					this.trackingForm.controls.trackingType.setValue(
						dataResult.detail.trackingType._id
					);
					this.trackingForm.controls.trackingType.disable();
					// client
					this.clientId = dataResult.detail.client._id;
					this.trackingForm.controls.client.setValue(
						dataResult.detail.client._id
					);
					this.trackingForm.controls.client.disable();
					// comments
					this.trackingForm.controls.comments.setValue(
						dataResult.detail.comments
					);
					this.audioUrl = dataResult.detail.voiceMediaUrl;
					this.trackingData = dataResult.detail;
					if (dataResult.detail.images && dataResult.detail.images.length) {
						this.uploadedFiles = dataResult.detail.images.map((image) => image);
					}
					this.trackingForm.controls.isArchived.setValue(
						!dataResult.detail.isArchived
					);
					switch (dataResult.detail.userRole) {
						case "owner":
							this.displaySelectedClientContacts(
								dataResult.detail.clientContact
							);
							this.trackingForm.controls.clientContact.setValue(
								dataResult.detail.clientContact.idNumber
							);
							//set configuration values
							this.trackingForm.controls.canInvitePeople.setValue(
								dataResult.detail.stakeholdersConfiguration
									? dataResult.detail.stakeholdersConfiguration.canInvitePeople
									: false
							);
							this.trackingForm.controls.canRemoveStakeholders.setValue(
								dataResult.detail.stakeholdersConfiguration
									.canRemoveStakeholders
									? dataResult.detail.stakeholdersConfiguration
											.canRemoveStakeholders
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
								case "0001":
									this.displaySelectedClientContacts({
										_id: dataResult.detail.client._id,
									});
									this.trackingForm.controls.communicationDate.setValue(
										dataResult.detail.communicationDate.toString().slice(0, 10)
									);
									this.trackingForm.controls.clientCommunicationWay.setValue(
										dataResult.detail.clientCommunicationWay._id
									);
									this.trackingForm.controls.clientContact.setValidators([
										Validators.required,
									]);
									this.trackingForm.controls.clientCommunicationWay.setValidators(
										[Validators.required]
									);
									this.trackingForm.controls.communicationDate.setValidators([
										Validators.required,
									]);
									this.trackingForm.controls.title.setValidators(null);
									this.showClientContact = true;
									break;
								case "0002":
									this.trackingForm.controls.title.setValue(
										dataResult.detail.title
									);
									this.showClientContact = false;
									break;
								case "0003":
									this.trackingForm.controls.title.setValue(
										dataResult.detail.title
									);
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
									this.trackingForm.controls.clientCommunicationWay.setErrors(
										null
									);
									this.trackingForm.controls.clientCommunicationWay.setValidators(
										null
									);
									this.trackingForm.controls.communicationDate.setErrors(null);
									this.trackingForm.controls.communicationDate.setValidators(
										null
									);
									this.showClientContact = false;
									break;
							}
							break;
						case "stakeholder":
							this.trackingForm.controls.isArchived.disable();
							this.showRecordAudio = false;
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

							this.canAddStakeholder =
								dataResult.detail.stakeholdersConfiguration.canInvitePeople;

							this.canRemoveStakeholders =
								dataResult.detail.stakeholdersConfiguration
									.canRemoveStakeholders || false;

							this.trackingForm.controls.clientName.setValue(
								dataResult.detail.client.companyName
							);

							switch (dataResult.detail.trackingType._id) {
								case "0001":
									this.displaySelectedClientContacts(
										dataResult.detail.clientContact
									);
									this.trackingForm.controls.clientContact.setValue(
										dataResult.detail.clientContact.idNumber
									);
									this.trackingForm.controls.clientContact.disable();
									this.trackingForm.controls.communicationDate.setValue(
										dataResult.detail.communicationDate.toString().slice(0, 10)
									);
									this.trackingForm.controls.clientContactName.setValue(
										dataResult.detail.clientContact.fullName
									);
									this.trackingForm.controls.clientCommunicationWay.setValue(
										dataResult.detail.clientCommunicationWay._id
									);
									break;
								case "0002":
									this.trackingForm.controls.title.setValue(
										dataResult.detail.title
									);
									break;
								case "0003":
									this.trackingForm.controls.title.setValue(
										dataResult.detail.title
									);
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
									this.trackingForm.controls.clientCommunicationWay.setErrors(
										null
									);
									this.trackingForm.controls.clientCommunicationWay.setValidators(
										null
									);
									this.trackingForm.controls.communicationDate.setErrors(null);
									this.trackingForm.controls.communicationDate.setValidators(
										null
									);
									this.showClientContact = false;
									break;
							}
							break;
					}
					this.stakeholders = dataResult.detail.stakeHolders.map(
						(stakeholder) => ({
							_id: stakeholder._id,
							fullName: `${stakeholder.fullName || "Usuario no Confirmado"}`,
							email: stakeholder.email,
							image:
								stakeholder.image ||
								"https://absque-public-stuff.s3.amazonaws.com/clifoll/user_icon.png",
							countryCode: stakeholder.countryCode,
							phoneNumber: stakeholder.phoneNumber,
							about: stakeholder.about,
							status: stakeholder.status,
							invitationStatus: stakeholder.invitationStatus,
						})
					);
					this.existingUsers = this.stakeholders.map(
						(stakeholder) => stakeholder._id
					);
					this.userRole = dataResult.detail.userRole;
					Swal.close();
				});
		}
	}

	private createRecord() {
		try {
			Swal.fire({
				title: "Guardar Datos",
				text: "¿Desea guardar los datos ingresados?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Guardar",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: "Guardando Datos",
						text: "Se estan guardando los datos, por favor espere",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();
					this.clientTrackingSrv.create(this.createFormData()).subscribe(
						(resultData: any) => {
							if (resultData.code === "success") {
								Swal.fire({
									title: "Datos Guardados",
									text: "Los datos fueron guardados correctamente\n¿Desea crear un nuevo Registro?",
									icon: "success",
									showCancelButton: true,
									cancelButtonText: "Volver",
									confirmButtonText: "Crear Nuevo",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animated tada",
									},
								}).then((result) => {
									if (result.value) {
										this.createFormObject(true);
										this.existingUsers = [];
										this.stakeholders = [];
										this.newUsers = [];
										if (this.clientId) {
											this.trackingForm.controls.client.setValue(this.clientId);
											this.trackingForm.controls.client.disable();
											this.displaySelectedClientContacts({
												_id: this.clientId,
											});
										}
										return;
									}
									this.activeModal.close(true);
								});
							} else {
								Swal.fire({
									title: "Error",
									text: "Error al intentar guardar los datos.\n".concat(
										resultData.detail
									),
									icon: "error",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animate fadeInUp",
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
								title: "Error",
								text: "Error al intentar guardar los datos.\n",
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
				text: JSON.stringify(ex),
				icon: "error",
				allowOutsideClick: false,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
		}
	}

	private modifyRecord() {
		try {
			Swal.fire({
				title: "Modificar Datos",
				text: "¿Desea modificar los datos ingresados?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Guardar",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: "Modificando Datos",
						text: "Se estan modificando los datos, por favor espere",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();
					this.clientTrackingSrv.modify(this.createFormData()).subscribe(
						(resultData: ServiceResultInterface) => {
							if (resultData.code === "success") {
								Swal.fire({
									title: "Datos Modificados",
									text: "Los datos fueron modificados correctamente",
									icon: "success",
									confirmButtonText: "Ok",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animated tada",
									},
								}).then((result) => {
									this.activeModal.close(true);
								});
							} else {
								Swal.fire({
									title: "Error",
									text: "Error al intentar modificar los datos.\n".concat(
										resultData.detail
									),
									icon: "error",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animate fadeInUp",
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
								title: "Error",
								text: "Error al intentar modificar los datos.\n",
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
				text: JSON.stringify(ex),
				icon: "error",
				allowOutsideClick: false,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
		}
	}

	private createFormObject(reset: boolean) {
		if (reset) {
			this.trackingForm.reset({
				_id: "",
				client: "",
				clientContact: "",
				clientCommunicationWay: "",
				communicationDate: "",
				selectedUser: "",
				comments: "",
				canRemoveStakeholders: false,
				canInvitePeople: false,
				canModify: false,
				canSeeClientContactsList: false,
			});
			return;
		}
	}

	private setStakeholdersConfiguration(config: any) {
		//canSeeClientContactsList
		/*if (config.canSeeClientContactsList) {
			this.showClientContact = true;
		} else {
			this.showClientContact = false;
		}*/
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
		if (
			config.canRemoveStakeholders &&
			!config.canInvitePeople &&
			!config.canModify
		) {
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
			canRemoveStakeholders:
				this.trackingForm.controls.canRemoveStakeholders.value,
			canModify: this.trackingForm.controls.canModify.value,
			canSeeClientContactsList:
				this.trackingForm.controls.canSeeClientContactsList.value,
		};
		if (this.trackingData && this.trackingData._id) {
			formData.append("_id", this.trackingData._id);
		}
		formData.append(
			"trackingType",
			this.trackingForm.controls.trackingType.value.toString()
		);
		formData.append(
			"client",
			this.trackingForm.controls.client.value.toString()
		);
		formData.append(
			"clientContact",
			this.trackingForm.controls.clientContact.value.toString()
		);
		formData.append(
			"clientCommunicationWay",
			this.trackingForm.controls.clientCommunicationWay.value.toString()
		);
		if (this.trackingForm.controls.title.value) {
			formData.append("title", this.trackingForm.controls.title.value);
		}
		formData.append("comments", this.trackingForm.controls.comments.value);
		formData.append(
			"communicationDate",
			this.trackingForm.controls.communicationDate.value
		);
		formData.append(
			"stakeholdersConfiguration",
			JSON.stringify(stakeholderConfiguration)
		);
		formData.append("peopleToInvite", JSON.stringify(this.peopleToInvite));
		formData.append(
			"isArchived",
			this.trackingForm.controls.isArchived.value ? "0" : "1"
		);
		if (this.trackingData && this.trackingData._id) {
			formData.append("voiceMediaUrl", this.trackingData.voiceMediaUrl);
			formData.append("images", JSON.stringify(this.trackingData.images));
		}

		if (this.audioFile) {
			formData.append(
				"files",
				this.audioFile,
				`${
					this.trackingForm.controls.client.value
				}-${new Date().getTime()}.voice.${
					(this.audioFile as File).type.split("/")[1]
				}`
			);
		}
		if (this.rawUploadedFiles) {
			let imageIndex = 0;
			this.rawUploadedFiles.forEach((uploadedFile) => {
				formData.append(
					"files",
					uploadedFile,
					`${
						this.trackingForm.controls.client.value
					}-${new Date().getTime()}-${imageIndex}.img.${
						(uploadedFile as File).type.split("/")[1]
					}`
				);
				imageIndex++;
			});
		}

		return formData;
	}
}
