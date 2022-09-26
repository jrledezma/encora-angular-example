import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import * as ConstValues from '../../../constant-values';

import {
	ClientInterface,
	ServiceResultInterface,
	UserInterface,
} from 'src/app/interfaces';
import {
	ActionsToTakeService,
	ClientDealsService,
	ClientsService,
	ConfigValuesService,
	ImageCompressorService,
	SessionCacheService,
	UsersService,
} from 'src/app/services';
import { ImageModalComponent } from '../modals/image-modal/image-modal.component';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UserInfoDetailComponent } from '../modals/user-info-detail/user-info-detail.component';
import { AttendNextActionComponent } from './attend-next-action.component';

var moment = require('moment');

@Component({
	selector: 'app-client-deal-detail',
	templateUrl: './client-deal-detail.component.html',
	styles: [],
})
export class ClientDealDetailComponent implements OnInit {
	@Input() dataId: string;
	@Input() clientId: string;
	@Input() communicationType: string;
	actionsToTakeCollection: any[] = [];
	dealForm: FormGroup;
	userSearchForm: FormGroup;
	trackingComments: any[] = [];
	clientsCollection: ClientInterface[] = [];
	productTypeDetailCollection: string[] = [];
	clientContacts: { idNumber: string; fullName: string }[] = [];
	availableUsers: any[] = [];
	stakeholders: any[] = [];
	usersToAsingTask: any[] = [];
	existingUsers: string[] = [];
	newUsers: string[] = [];
	userRole = '';
	dealData: any = {};
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
	maxSelectableDate = moment().utcOffset(0, true).format().split('T')[0];
	minSelectableDate = moment().add('days', 1).utcOffset(0, true).format().split('T')[0];
	peopleToInvite: { _id?: string; email: string }[] = [];
	dealTracking: any[] = [];
	// pagination
	changeLogPaginationOpt: any = {};
	stakeholdersPaginationOpt: any = {};
	//images
	uploadedFiles: any[] = [];
	rawUploadedFiles: any[] = [];

	private toast = ConstValues.Toast;
	private stakeholdersToRevokeInvitations: any[] = [];

	constructor(
		private actionsToTakeSrv: ActionsToTakeService,
		private activatedRoute: ActivatedRoute,
		private changeDetector: ChangeDetectorRef,
		private clientDealsSrv: ClientDealsService,
		private clientsSrv: ClientsService,
		private configValuesSrv: ConfigValuesService,
		private imageCompressorSrv: ImageCompressorService,
		private modalService: NgbModal,
		private router: Router,
		private sessionCacheSrv: SessionCacheService,
		private usersSrv: UsersService
	) {
		this.createFormObject(false);
	}

	ngOnInit() {
		this.configValuesSrv.getUserStatus().subscribe((observer: ServiceResultInterface) => {
			if (observer.code === 'success') {
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
			previousLabel: 'Anterior',
			nextLabel: 'Siguiente',
		};
		this.changeLogPaginationOpt = { ...paginationOptions };
		this.stakeholdersPaginationOpt = { ...paginationOptions };

		this.createFormGroup();
		this.getActionsToTake();
		this.getClients();
		this.getDealData();

		this.userSearchForm.get('filter').valueChanges.subscribe((val) => {
			this.searchUsers(val);
		});
	}

	ngAfterViewChecked() {
		this.changeDetector.detectChanges();
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

	save() {
		if (!this.dataId) {
			this.createRecord();
		} else {
			this.modifyRecord();
		}
	}

	onEnter(selectedUser?: any) {
		this.addStakeHolder(selectedUser);
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
		if (this.stakeholders || this.stakeholders.length) {
			this.dealForm.controls.teamMemberInCharge.enable();
			this.dealForm.controls.asignActionToTakeToSessionUser.enable();
		} else if (!this.stakeholders || !this.stakeholders.length) {
			this.dealForm.controls.asignActionToTakeToSessionUser.setValue(true);
			this.dealForm.controls.asignActionToTakeToSessionUser.disable();
			this.dealForm.controls.teamMemberInCharge.disable();
		}
		this.createUsersToAsingTaskList();
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
		if (!this.stakeholders || !this.stakeholders.length) {
			this.dealForm.controls.teamMemberInCharge.disable();
			this.dealForm.controls.asignActionToTakeToSessionUser.setValue(true);
			this.dealForm.controls.asignActionToTakeToSessionUser.disable();
		}
		this.createUsersToAsingTaskList();
		this.dealData.stakeholders = this.stakeholders;
	}

	displaySelectedClientContacts(selectedClient: any) {
		console.log('selectedClient =>', selectedClient);
		if (selectedClient) {
			if (selectedClient._id !== this.dealForm.controls.client.value) {
				this.dealForm.controls.clientContact.setValue(null);
			}
			this.clientsCollection.forEach((client) => {
				if (selectedClient._id === client._id) {
					this.clientContacts = client.contacts.map((contact) => {
						return {
							idNumber: contact.idNumber,
							fullName: `${contact.firstName} ${contact.lastName} - ${contact.email}`,
						};
					});
					return;
				}
			});
			if (this.clientContacts || this.clientContacts.length) {
				this.dealForm.controls.clientContact.enable();
			}
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

	leaveDeal() {
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
					this.clientDealsSrv.leaveTracking(this.dealData._id).subscribe(
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
							}).then((result) => {});
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

	teamMemberInChargeChange($event) {
		if (!$event) {
			this.dealForm.controls.asignActionToTakeToSessionUser.setValue(true);
		} else {
			if (!$event.email) {
				this.dealForm.controls.asignActionToTakeToSessionUser.setValue(true);
			} else {
				this.dealForm.controls.asignActionToTakeToSessionUser.setValue(false);
			}
		}
	}

	asignActionToTakeToSessionUserCheckedChanged($event) {
		if (!$event.currentTarget.checked) {
			this.dealForm.controls.asignActionToTakeToSessionUser.setValidators(null);
			this.dealForm.controls.teamMemberInCharge.setValidators([Validators.required]);
			this.dealForm.controls.teamMemberInCharge.setValue(null);
		} else {
			this.dealForm.controls.teamMemberInCharge.setValidators(null);
			this.dealForm.controls.teamMemberInCharge.setValue(null);
			this.dealForm.controls.asignActionToTakeToSessionUser.setValidators([
				Validators.required,
			]);
		}
	}

	openAttendNextActionModal(selectedActionId: string) {
		const modalRef = this.modalService.open(AttendNextActionComponent, {
			keyboard: false,
			backdrop: false,
			centered: true,
			size: 'lg',
			windowClass: 'animated fadeIn',
		});
		modalRef.componentInstance.dataId = selectedActionId || null;
		modalRef.componentInstance.teamMembers = this.dealData.teamMembers;
		modalRef.result.then(
			(value: any) => {
				this.getDealData();
			},
			() => {}
		);
	}

	private createUsersToAsingTaskList() {
		this.usersToAsingTask = this.stakeholders.map((stakeholder) => {
			return {
				_id: stakeholder._id,
				email: stakeholder.email,
				fullName: `${stakeholder.fullName} - ${stakeholder.email}`,
			};
		});
		if (this.dealData) {
			this.dealData.teamMembers = this.usersToAsingTask;
		}
	}

	private getActionsToTake() {
		try {
			this.actionsToTakeSrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== 'success') {
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener las Acciones a Tomar.\n ${response.detail}`,
						});
						return;
					}
					this.actionsToTakeCollection = response.detail;
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
						text: `Error al obtener las Acciones a Tomar.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: 'error',
				text: `Error al obtener las Acciones a Tomar.\n ${ex.message}`,
			});
		}
	}

	private createFormGroup() {
		this.dealForm = new FormGroup({
			referenceCode: new FormControl(
				'',
				[Validators.required],
				this.validateRefCode.bind(this)
			),
			client: new FormControl('', [Validators.required]),
			title: new FormControl('', [Validators.required]),
			comments: new FormControl('', [Validators.required]),
			actionToTake: new FormControl('', [Validators.required]),
			clientContact: new FormControl({ value: '', disabled: true }),
			clientContactName: new FormControl({ value: '', disabled: true }),
			asignActionToTakeToSessionUser: new FormControl(false, [Validators.required]),
			teamMemberInCharge: new FormControl(''),
			scheduleDate: new FormControl('', [Validators.required]),
			scheduleHour: new FormControl('', [Validators.required]),
			trackingComments: new FormControl('', [Validators.required]),
			isArchived: new FormControl(false),
		});
		this.createFormObject(true);
		if (!this.dealData._id) {
			this.dealForm.controls.teamMemberInCharge.disable();
			this.dealForm.controls.asignActionToTakeToSessionUser.disable();
			this.dealForm.controls.asignActionToTakeToSessionUser.setValue(true);
		}
		//this.dealForm.setValue(this.clientData);
		this.userSearchForm = new FormGroup({
			filter: new FormControl('', [Validators.email]),
		});
	}

	private getClients() {
		try {
			this.clientsSrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== 'success') {
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener los Clientes.\n ${response.detail}`,
						});
						return;
					}
					this.clientsCollection = response.detail;
					if (this.clientId) {
						this.dealForm.controls.client.setValue(this.clientId);
						this.dealForm.controls.client.disable();
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
						icon: 'error',
						text: `Error al obtener los Clientes.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: 'error',
				text: `Error al obtener los Clientes.\n ${ex.message}`,
			});
		}
	}

	private getDealData() {
		if (this.activatedRoute.snapshot.params['id']) {
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
			this.clientDealsSrv
				.getById(this.activatedRoute.snapshot.params['id'])
				.subscribe((dataResult: ServiceResultInterface) => {
					console.log('dataResult =>', dataResult);
					if (dataResult.code !== 'success') {
						if (dataResult.code === 'notDataFound') {
							Swal.fire({
								title: 'Trato no Encontrado',
								html: '<p>El trato que buscas no ha sido encontrado</p><h6>¿Desea crear un nuevo trato para el cliente seleccionado?</h6>',
								icon: 'warning',
								allowOutsideClick: false,
								allowEscapeKey: true,
								showCancelButton: true,
								cancelButtonText: 'Cancelar',
								cancelButtonColor: '#d9534f',
								confirmButtonText: 'Crear Trato',
								confirmButtonColor: '#5cb85c',
								showClass: {
									popup: 'animated fadeInUp',
								},
							}).then((result) => {
								console.log('result =>', result);
								if (result.value) {
									Swal.close();
									return;
								}
								this.router.navigateByUrl('/deals');
							});
							return;
						}
						this.toast.fire({
							icon: 'error',
							html: '<h6 class="ml-3 mt-1">Sucedió un error al obtener los datos del trato</h6>',
						});

						return;
					}
					this.dealData = dataResult.detail.dealData;
					this.dealForm.reset(this.dealData);
					this.dealForm.controls.client.setValue(this.dealData.client._id);
					this.dealTracking = dataResult.detail.dealTrackingDetail;
					/*
					this.trackingComments = dataResult.detail.trackingComments;
					// client
					this.clientId = dataResult.detail.client._id;
					this.dealForm.controls.client.setValue(dataResult.detail.client._id);
					this.dealForm.controls.client.disable();
					// comments
					this.dealForm.controls.comments.setValue(dataResult.detail.comments);
					if (dataResult.detail.images && dataResult.detail.images.length) {
						this.uploadedFiles = dataResult.detail.images.map((image) => image);
					}
					this.dealForm.controls.isArchived.setValue(!dataResult.detail.isArchived);
					if (dataResult.detail.stakeHolders) {
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
					}
					this.existingUsers = this.stakeholders.map((stakeholder) => stakeholder._id);
					this.userRole = dataResult.detail.userRole;
					*/
					Swal.close();
				});
		}
	}

	private createRecord() {
		try {
			Swal.fire({
				title: 'Guardar Datos',
				text: '¿Desea guardar los datos ingresados?',
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
						title: 'Guardando Datos',
						text: 'Se estan guardando los datos, por favor espere',
						icon: 'info',
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: 'animate fadeInUp',
						},
					});
					Swal.showLoading();
					this.clientDealsSrv.create(this.createFormData()).subscribe(
						(resultData: any) => {
							console.log('resultData.detail =>', resultData.detail);
							if (resultData.code === 'success') {
								Swal.fire({
									title: 'Datos Guardados',
									text: 'Los datos fueron guardados correctamente.',
									icon: 'success',
									confirmButtonText: 'Ok',
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: 'animated tada',
									},
								}).then((result) => {
									if (result.value) {
										//{ clientDeal: clientDealResult, clientDealTracking: dealTrackingResult }
										this.dealData = (resultData.detail as any).clientDeal;
										this.dealTracking.push(resultData.clientDealTracking as any);
										return;
									}
								});
							} else {
								Swal.fire({
									title: 'Error',
									text: 'Error al intentar guardar los datos.\n'.concat(
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
							Swal.fire({
								title: 'Error',
								text: 'Error al intentar guardar los datos.\n',
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

	private modifyRecord() {
		try {
			Swal.fire({
				title: 'Modificar Datos',
				text: '¿Desea modificar los datos ingresados?',
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
					this.clientDealsSrv.modify(this.createFormData()).subscribe(
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
								}).then((result) => {});
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

	private createFormObject(reset: boolean) {
		if (reset) {
			this.dealForm.reset({
				_id: '',
				client: '',
				clientContact: '',
				actionToTake: '',
				scheduleDate: '',
				selectedUser: '',
				comments: '',
				canRemoveStakeholders: false,
				canInvitePeople: false,
				canModify: false,
				canSeeClientContactsList: false,
			});
			return;
		}
	}

	private createFormData(): FormData {
		//create clientDeal Object
		const clientDealObj = {
				_id: this.dealData._id,
				client: this.dealForm.controls.client.value,
				referenceCode: this.dealForm.controls.referenceCode.value,
				title: this.dealForm.controls.title.value,
				comments: this.dealForm.controls.comments.value,
				mediaUrls: this.dealData.images ? this.dealData.images : [],
				teamMembers: this.stakeholders,
			},
			//create clientDealTracking Object
			clientDealTrackingObj = {
				_id: this.dealData._id,
				actionToTake: this.dealForm.controls.actionToTake.value,
				clientContact: this.dealForm.controls.clientContact.value,
				scheduleDate: this.dealForm.controls.scheduleDate.value,
				scheduleHour: this.dealForm.controls.scheduleHour.value,
				trackingComments: this.dealForm.controls.trackingComments.value,
				teamMemberInCharge: this.dealForm.controls.teamMemberInCharge.value,
			};

		const formData = new FormData();
		formData.append('clientDeal', JSON.stringify(clientDealObj));
		formData.append('clientDealTracking', JSON.stringify(clientDealTrackingObj));
		if (this.peopleToInvite.length) {
			formData.append('peopleToInvite', JSON.stringify(this.peopleToInvite));
		}
		formData.append(
			'stakeholdersToRevokeInvitations',
			JSON.stringify(this.stakeholdersToRevokeInvitations)
		);
		if (this.rawUploadedFiles) {
			let imageIndex = 0;
			this.rawUploadedFiles.forEach((uploadedFile) => {
				formData.append(
					'files',
					uploadedFile,
					`${
						this.dealForm.controls.client.value
					}-${new Date().getTime()}-${imageIndex}.img.${
						(uploadedFile as File).type.split('/')[1]
					}`
				);
				imageIndex++;
			});
		}

		return formData;
	}

	private validateRefCode(control: FormControl): Observable<any | null> {
		try {
			return this.clientDealsSrv.validateReferenceCode(control.value).pipe(
				map((dataResult: ServiceResultInterface) => {
					console.log('dataResult =>', dataResult);
					if (dataResult.code === 'valueAlreadyCreated') {
						if (dataResult.detail._id !== this.dealData._id) {
							if (
								dataResult.detail.referenceCode.toLowerCase() ===
								control.value.toLowerCase().trim()
							) {
								return { exists: true };
							}
						}
						return null;
					}
					if (dataResult.code === 'notDataFound') {
						return null;
					}
				})
			);
		} catch (ex) {}
	}
}
