import {
	Component,
	OnInit,
	Input,
	ViewChild,
	ContentChild,
	ElementRef,
} from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import * as ConstValues from '../../../constant-values';

import { ClientDealTrackingInterface, ServiceResultInterface } from 'src/app/interfaces';
import {
	ClientDealsTrackingService,
	ClientDealTrackingsService,
	ImageCompressorService,
} from 'src/app/services';
import { CreateNextActionComponent } from './create-next-action.component';

var moment = require('moment');

@Component({
	selector: 'app-attend-next-acction',
	templateUrl: './attend-next-action.component.html',
	styles: [],
})
export class AttendNextActionComponent implements OnInit {
	@Input() dataId: string;
	@Input() teamMembers: any[] = [];
	@ViewChild(CreateNextActionComponent, { static: true })
	nextActionCpt: CreateNextActionComponent;
	actionToAttend: ClientDealTrackingInterface;
	currentAttentionStep = 1;
	actionToTakeAttentionForm: FormGroup;
	productTypeDetailCollection: string[] = [];

	private toast = ConstValues.Toast;

	constructor(
		public activeModal: NgbActiveModal,
		private clientDealTrackingsSrv: ClientDealTrackingsService,
		private location: Location,
		private modalService: NgbModal,
		private dealTrackingSrv: ClientDealsTrackingService
	) {}

	ngOnInit() {
		this.createFormGroups();
		this.getActionToTake();
	}

	closeModal(event) {
		console.log('event =>', event);
	}

	saveData() {
		console.log('form =>', this.nextActionCpt.nextActionForm.controls);
	}

	private createFormGroups() {
		this.actionToTakeAttentionForm = new FormGroup({
			attentionDetail: new FormControl('', [Validators.required]),
		});
	}

	private getActionToTake() {
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
			this.clientDealTrackingsSrv.getById(this.dataId).subscribe(
				(dataResult: ServiceResultInterface) => {
					if (dataResult.code !== 'success') {
						this.toast.fire({
							icon: 'error',
							text: `Error al obtener el detalle de la Acción a Tomar.\n`,
						});
						return;
					}
					console.log('actionToAttend =>', dataResult.detail);
					this.actionToAttend = dataResult.detail as ClientDealTrackingInterface;
					this.nextActionCpt.getClientContacts(this.actionToAttend.deal.client);
					Swal.close();
				},
				(error) => {
					this.toast.fire({
						icon: 'error',
						text: `Error al obtener el detalle de la Acción a Tomar.\n`,
					});
				}
			);
		}
	}

	createRecord() {
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
					this.dealTrackingSrv
						.attentTracking(
							this.actionToAttend._id,
							this.actionToTakeAttentionForm.controls.attentionDetail.value,
							this.nextActionCpt.createFormData()
						)
						.subscribe(
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
											this.activeModal.close();
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
}
