import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import Swal from 'sweetalert2';

import * as ConstValues from '../../../constant-values';
import { ActionsToTakeService } from 'src/app/services';
import { ClientsService } from '../../services/clients.service';
import { ClientDealTrackingsService } from '../../services/client-deal-trackings.service';
import { ServiceResultInterface } from 'src/app/interfaces';
import { AttendNextActionComponent } from './attend-next-action.component';
import { ClientDealsTrackingService } from '../../services/client-deals-tracking.service';

var moment = require('moment');

@Component({
	selector: 'app-create-next-action',
	templateUrl: './create-next-action.component.html',
	styles: [],
})
export class CreateNextActionComponent implements OnInit {
	@Input()
	dealId;
	@Input()
	teamMembers: any[] = [];
	@Input()
	trackingId: string;
	@Input()
	attentionDetail: string;
	@Output() closeModal = new EventEmitter<boolean>();

	actionsToTakeCollection: any[] = [];
	clientContacts: any[] = [];
	nextActionForm: FormGroup;
	maxSelectableDate = moment().utcOffset(0, true).format().split('T')[0];
	minSelectableDate = moment().add('days', 1).utcOffset(0, true).format().split('T')[0];
	rawUploadedFiles: any[] = [];

	private toast = ConstValues.Toast;

	constructor(
		private actionsToTakeSrv: ActionsToTakeService,
		private clientsSrv: ClientsService
	) {}

	ngOnInit() {
		this.createFormGroup();
		this.getActionsToTake();
	}

	asignActionToTakeToSessionUserCheckedChanged($event) {
		if (!$event.currentTarget.checked) {
			this.nextActionForm.controls.asignActionToTakeToSessionUser.setValidators(null);
			this.nextActionForm.controls.teamMemberInCharge.setValidators([
				Validators.required,
			]);
			this.nextActionForm.controls.teamMemberInCharge.setValue(null);
		} else {
			this.nextActionForm.controls.teamMemberInCharge.setValidators(null);
			this.nextActionForm.controls.teamMemberInCharge.setValue(null);
			this.nextActionForm.controls.asignActionToTakeToSessionUser.setValidators([
				Validators.required,
			]);
		}
	}

	teamMemberInChargeChange($event) {
		if (!$event) {
			this.nextActionForm.controls.asignActionToTakeToSessionUser.setValue(true);
		} else {
			if (!$event.email) {
				this.nextActionForm.controls.asignActionToTakeToSessionUser.setValue(true);
			} else {
				this.nextActionForm.controls.asignActionToTakeToSessionUser.setValue(false);
			}
		}
	}

	getClientContacts(clientId) {
		try {
			this.clientsSrv.getContacts(clientId).subscribe(
				(observable) => {
					if (observable.code !== 'success') {
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener los contactos del cliente.`,
						});
					}
					this.clientContacts = (observable.detail as any[]).map((item) => {
						return {
							idNumber: item.idNumber,
							fullName: `${item.firstName} ${item.lastName}`,
						};
					});
				},
				(error) => {
					this.toast.fire({
						icon: 'error',
						text: `Error al obtener los contactos del cliente.`,
					});
				}
			);
		} catch (error) {
			this.toast.fire({
				icon: 'error',
				text: `Error al obtener los contactos del cliente.`,
			});
		}
	}

	isFormInvalid() {
		return this.nextActionForm.invalid;
	}

	createFormData(): FormData {
		//create clientDealTracking Object
		const formData = new FormData();
		formData.append('deal', this.dealId);
		formData.append('actionToTake', this.nextActionForm.controls.actionToTake.value);
		formData.append('clientContact', this.nextActionForm.controls.clientContact.value);
		formData.append('scheduleDate', this.nextActionForm.controls.scheduleDate.value);
		formData.append('scheduleHour', this.nextActionForm.controls.scheduleHour.value);
		formData.append(
			'trackingComments',
			this.nextActionForm.controls.trackingComments.value
		);
		formData.append(
			'teamMemberInCharge',
			this.nextActionForm.controls.teamMemberInCharge.value
		);

		if (this.rawUploadedFiles) {
			let imageIndex = 0;
			this.rawUploadedFiles.forEach((uploadedFile) => {
				formData.append(
					'files',
					uploadedFile,
					`${
						this.nextActionForm.controls.client.value
					}-${new Date().getTime()}-${imageIndex}.img.${
						(uploadedFile as File).type.split('/')[1]
					}`
				);
				imageIndex++;
			});
		}
		console.log('formData =>', formData.getAll('deal'));
		return formData;
	}

	private createFormGroup() {
		this.nextActionForm = new FormGroup({
			actionToTake: new FormControl('', [Validators.required]),
			clientContact: new FormControl('', [Validators.required]),
			clientContactName: new FormControl({ value: '', disabled: true }),
			asignActionToTakeToSessionUser: new FormControl(false, [Validators.required]),
			teamMemberInCharge: new FormControl(''),
			scheduleDate: new FormControl('', [Validators.required]),
			scheduleHour: new FormControl('', [Validators.required]),
			trackingComments: new FormControl('', [Validators.required]),
			isArchived: new FormControl(false),
		});
		if (!this.teamMembers || !this.teamMembers.length) {
			this.nextActionForm.controls.teamMemberInCharge.disable();
			this.nextActionForm.controls.asignActionToTakeToSessionUser.disable();
			this.nextActionForm.controls.asignActionToTakeToSessionUser.setValue(true);
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
}
