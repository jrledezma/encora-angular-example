import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import * as ConstValues from '../../../constant-values';

import {
	ClientInterface,
	ServiceResultInterface,
	ClientWayOfEntryInterface,
	ClientContactInterface,
} from 'src/app/interfaces';
import { ClientsService, ClientWayOfEntriesService } from 'src/app/services';
import { ClientContactModalComponent } from '../modals/client-contact-modal/client-contact-modal.component';

@Component({
	selector: 'app-client-modal',
	templateUrl: './client-modal.component.html',
	styles: [],
})
export class ClientModalComponent implements OnInit {
	@Input() dataId: string;
	clientData: ClientInterface;
	clientForm: FormGroup;
	waysOfEntriesCollection: ClientWayOfEntryInterface[] = [];
	productTypeDetailCollection: string[] = [];
	contacts: ClientContactInterface[] = [];
	paginationOpt: any = {};

	private toast = ConstValues.Toast;

	constructor(
		private modalService: NgbModal,
		public activeModal: NgbActiveModal,
		private clientSrv: ClientsService,
		private waysOfEntrySrv: ClientWayOfEntriesService,
		private location: Location
	) {
		this.createUserObject(false);
		this.location.subscribe((location) => {
			// ...close popup
			this.activeModal.close();
		});
	}

	ngOnInit() {
		this.createFormGroup();
		this.getClientWayOfEntry();
		this.getClientData();
		this.paginationOpt = {
			currentPage: 1,
			itemsPerPage: 4,
			maxSize: 5,
			directionLinks: true,
			autoHide: true,
			responsive: true,
			previousLabel: 'Anterior',
			nextLabel: 'Siguiente',
		};
	}

	pageChange(newPage: number) {
		this.paginationOpt.currentPage = newPage;
	}

	save() {
		if (!this.clientData._id) {
			this.createRecord();
		} else {
			this.modifyRecord();
		}
	}

	private createFormGroup() {
		this.clientForm = new FormGroup({
			idNumber: new FormControl(
				'',
				[Validators.required, Validators.minLength(2)],
				this.validateValue.bind(this)
			),
			companyName: new FormControl('', [Validators.required]),
			email: new FormControl('', [Validators.email]),
			phoneNumber: new FormControl(''),
			address: new FormControl(''),
			wayOfEntry: new FormControl('', [Validators.required]),
			dateOfEntry: new FormControl('', [Validators.required]),
			comments: new FormControl('', [
				Validators.minLength(15),
				Validators.maxLength(250),
			]),
			showCommunicationWays: new FormControl(false),
			isActive: new FormControl({ value: true, disabled: true }, [Validators.required]),
			firstNameFilter: new FormControl(''),
			lastNameFilter: new FormControl(''),
			canShowIdNumber: new FormControl(false),
			canShowEmailAddress: new FormControl(false),
			canShowPhoneNumber: new FormControl(false),
		});
		this.createUserObject(true);
		//this.clientForm.setValue(this.clientData);
	}

	private getClientWayOfEntry() {
		try {
			this.waysOfEntrySrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== 'success') {
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener los Medios de Ingreso.\n ${response.detail}`,
						});
						return;
					}
					this.waysOfEntriesCollection = response.detail;
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

	private getClientData() {
		if (this.dataId) {
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
			this.clientSrv
				.getById(this.dataId)
				.subscribe((dataResult: ServiceResultInterface) => {
					this.clientData = dataResult.detail as ClientInterface;
					this.clientForm.reset(dataResult.detail as ClientInterface);
					this.clientForm.controls.dateOfEntry.setValue(
						this.clientData.dateOfEntry.toString().slice(0, 10)
					);
					this.clientForm.controls.isActive.enable();
					//set isSavedInDB property for contacts
					if (this.clientData.contacts) {
						this.clientData.contacts.forEach((contact) => {
							contact.isSavedInDB = true;
						});
					}
					if (this.clientData.configuration) {
						this.clientForm.controls.canShowEmailAddress.setValue(
							this.clientData.configuration.canShowEmailAddress
						);
						this.clientForm.controls.canShowPhoneNumber.setValue(
							this.clientData.configuration.canShowPhoneNumber
						);
						this.clientForm.controls.canShowIdNumber.setValue(
							this.clientData.configuration.canShowIdNumber
						);
					}
					this.contacts = this.clientData.contacts;
					Swal.close();
				});
		}
	}

	private createRecord() {
		try {
			Swal.fire({
				title: 'Guardar Datos',
				text: 'Desea guardar los datos ingresados?',
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
					this.clientSrv
						.create({
							idNumber: this.clientForm.controls.idNumber.value,
							companyName: this.clientForm.controls.companyName.value,
							email: this.clientForm.controls.email.value,
							phoneNumber: this.clientForm.controls.phoneNumber.value,
							address: this.clientForm.controls.address.value,
							wayOfEntry: this.clientForm.controls.wayOfEntry.value,
							dateOfEntry: this.clientForm.controls.dateOfEntry.value,
							contacts: this.contacts,
							configuration: {
								canShowEmailAddress:
									this.clientForm.controls.canShowEmailAddress.value || false,
								canShowPhoneNumber:
									this.clientForm.controls.canShowPhoneNumber.value || false,
								canShowIdNumber: this.clientForm.controls.canShowIdNumber.value || false,
							},
							comments: this.clientForm.controls.comments.value,
							isActive: true,
						})
						.subscribe(
							(resultData: any) => {
								if (resultData.code === 'success') {
									Swal.fire({
										title: 'Datos Guardados',
										text: 'Los datos fueron guardados correctamente\nDesea crear un nuevo Usuario?',
										icon: 'success',
										showCancelButton: true,
										cancelButtonText: 'Volver',
										confirmButtonText: 'Crear Nuevo',
										allowOutsideClick: false,
										allowEscapeKey: true,
										showClass: {
											popup: 'animated tada',
										},
									}).then((result) => {
										if (result.value) {
											this.createUserObject(true);
											return;
										}
										this.activeModal.close(true);
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
					this.clientSrv
						.modify({
							_id: this.dataId,
							idNumber: this.clientForm.controls.idNumber.value,
							companyName: this.clientForm.controls.companyName.value,
							email: this.clientForm.controls.email.value,
							phoneNumber: this.clientForm.controls.phoneNumber.value,
							address: this.clientForm.controls.address.value,
							wayOfEntry: this.clientForm.controls.wayOfEntry.value,
							dateOfEntry: this.clientForm.controls.dateOfEntry.value,
							comments: this.clientForm.controls.comments.value,
							contacts: this.contacts,
							configuration: {
								canShowEmailAddress:
									this.clientForm.controls.canShowEmailAddress.value || false,
								canShowPhoneNumber:
									this.clientForm.controls.canShowPhoneNumber.value || false,
								canShowIdNumber: this.clientForm.controls.canShowIdNumber.value || false,
							},
							isActive: this.clientForm.controls.isActive.value,
						})
						.subscribe(
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
									}).then((result) => {
										this.activeModal.close(true);
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

	openContactDetailModal(contact?: ClientContactInterface) {
		const modalRef = this.modalService.open(ClientContactModalComponent, {
			keyboard: false,
			backdrop: false,
			centered: true,
			size: 'lg',
			windowClass: 'animated fadeIn',
		});
		if (contact) {
			modalRef.componentInstance.data = contact;
			modalRef.componentInstance.clientId = this.dataId;
		} else {
			modalRef.componentInstance.data = undefined;
		}
		modalRef.componentInstance.isNewContact = contact ? !contact.isSavedInDB : true;

		modalRef.result.then(
			(contactValue: any) => {
				let contactFound = false;
				if (contactValue) {
					this.contacts = this.contacts.map((existingContact: ClientContactInterface) => {
						if (contactValue.idNumber === existingContact.idNumber) {
							existingContact = contactValue;
							existingContact.isSavedInDB = contact.isSavedInDB;
							contactFound = true;
						}
						return existingContact;
					});
					if (!contactFound) {
						this.contacts.push(contactValue as ClientContactInterface);
					}
				}
			},
			() => {}
		);
	}

	removeContact(idNumber: string) {
		this.contacts = this.contacts.filter((contact) => {
			if (idNumber !== contact.idNumber) {
				return contact;
			}
		});
	}

	private createUserObject(reset: boolean) {
		if (reset) {
			this.clientForm.reset({
				_id: '',
				idNumber: '',
				companyName: '',
				email: '',
				phoneNumber: '',
				address: '',
				wayOfEntry: '',
				dateOfEntry: '',
				comments: '',
				isActive: true,
			});
			return;
		}
		this.clientData = {
			idNumber: '',
			companyName: '',
			email: '',
			phoneNumber: '',
			address: '',
			wayOfEntry: '',
			dateOfEntry: new Date(),
			comments: '',
			contacts: [],
			isActive: true,
		};
	}

	private validateValue(control: FormControl): Observable<any | null> {
		try {
			return this.clientSrv.validateIdNumber(control.value).pipe(
				map((dataResult: ServiceResultInterface) => {
					if (dataResult.code === 'idNumberAlreadyCreated') {
						if (dataResult.detail._id !== this.clientData._id) {
							if (
								dataResult.detail.value.toLowerCase() ===
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
