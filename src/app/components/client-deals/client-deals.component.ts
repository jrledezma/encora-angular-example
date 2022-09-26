import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import * as ConstValues from '../../../constant-values';
import * as moment from 'moment';

import { ClientInterface, ServiceResultInterface } from 'src/app/interfaces';
import {
	ClientDealsService,
	SessionCacheService,
	ConfigValuesService,
} from '../../services';
import { ClientDealModalComponent } from './client-deal-modal.component';
import { UserInfoDetailComponent } from '../modals/user-info-detail/user-info-detail.component';

@Component({
	selector: 'app-client-deals',
	templateUrl: './client-deals.component.html',
	styles: [],
})
export class ClientDealsComponent implements OnInit {
	originalDealsList: any[] = [];
	dealsList: any[] = [];
	filterForm: FormGroup;
	userStatus: any = {};
	paginationOpt: any = {};
	clientTypeFilter = 'all';

	private toast = ConstValues.Toast;

	constructor(
		private modalService: NgbModal,
		private clienDealsSrv: ClientDealsService,
		private sessionCacheSrv: SessionCacheService,
		private router: Router,
		private configValuesSrv: ConfigValuesService
	) {
		this.sessionCacheSrv.getSessionData().subscribe((observer: any) => {});
	}

	ngOnInit() {
		this.configValuesSrv.getUserStatus().subscribe((observer: ServiceResultInterface) => {
			if (observer.code === 'success') {
				this.userStatus = observer.detail;
			}
		});
		this.getData();
		this.filterForm = new FormGroup({
			clientIdNumber: new FormControl(''),
			clientCompanyName: new FormControl(''),
			clientEmail: new FormControl(''),
			cellPhone: new FormControl(''),
			communicationWay: new FormControl(''),
			communicationDate: new FormControl(''),
		});
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

	filterChange(clientType: string) {
		if (this.originalDealsList.length) {
			this.clientTypeFilter = clientType;
			this.dealsList = this.originalDealsList.filter((tracking) => {
				let returnedTracking: any = null;
				switch (clientType) {
					case 'all':
						returnedTracking = tracking;
						break;
					case 'own':
						if (tracking.ownClient) {
							returnedTracking = tracking;
						}
						break;
					case 'external':
						if (!tracking.ownClient) {
							returnedTracking = tracking;
						}
						break;
				}
				if (returnedTracking) {
					return returnedTracking;
				}
			});
		}
	}

	search() {
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
		const prvListLength = this.dealsList.length;
		this.dealsList = [];
		this.clienDealsSrv.getClients(this.createFilterObject()).subscribe(
			(resultData: ServiceResultInterface) => {
				if (resultData.code === 'error') {
					Swal.fire({
						title: 'Error',
						text: 'Error al obtener los datos.\n'.concat(resultData.detail),
						icon: 'error',
						allowOutsideClick: false,
						allowEscapeKey: true,
						showClass: {
							popup: 'animate fadeInUp',
						},
					});
					return;
				}
				if (resultData.detail.length === 0) {
					Swal.fire({
						title: 'Datos no Encontrados',
						text: 'No fue posible encontrar datos con los filtros ingresados',
						icon: 'warning',
						allowEscapeKey: true,
						allowOutsideClick: false,
						allowEnterKey: false,
						showClass: {
							popup: 'animate fadeInUp',
						},
					});
					return;
				}
				Swal.close();
				this.originalDealsList = resultData.detail;
				this.dealsList = resultData.detail;
				this.filterChange(this.clientTypeFilter);
				if (this.dealsList.length !== prvListLength) {
					this.paginationOpt.currentPage = 1;
				}
			},
			(error: any) => {
				/*if (error === "unauthorized") {
					this.toast.fire({
						icon: "error",
						html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
					});
					return;
				}*/
				Swal.fire({
					title: 'Error',
					text: 'Error al intentar obtener los datos.\n',
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

	openDetailModal(selectedId: ClientInterface) {
		this.router.navigate(['deal', selectedId ? selectedId : '']);
	}

	goToDetail(dealId: string) {
		console.log('dealId =>', dealId);
		this.router.navigateByUrl(`deal/${dealId}`);
	}

	pageChange(newPage: number) {
		this.paginationOpt.currentPage = newPage;
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
			modalRef.componentInstance.userInfo = {
				...selectedUser,
				fullName: `${selectedUser.firstName} ${selectedUser.lastName}`,
			};
		}
	}

	private createFilterObject(): any {
		let filter: any = {
			client: {},
			communication: {},
		};
		if (this.filterForm.controls.clientIdNumber.value) {
			filter.client.idNumber = this.filterForm.controls.idNumber.value;
		}
		if (this.filterForm.controls.clientCompanyName.value) {
			filter.client.companyName = this.filterForm.controls.clientCompanyName.value;
		}
		if (this.filterForm.controls.clientEmail.value) {
			filter.client.email = this.filterForm.controls.clientEmail.value;
		}
		if (this.filterForm.controls.communicationWay.value) {
			filter.communication.clientCommunicationWay =
				this.filterForm.controls.communicationWay.value;
		}
		if (this.filterForm.controls.communicationDate.value) {
			filter.communication.communicationDate =
				this.filterForm.controls.communicationDate.value;
		}
		return filter;
	}

	validateNexActionDate(date, hour) {
		console.log('moment date => ', moment(`${date} ${hour}`));
	}

	private getData() {
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
		this.clienDealsSrv.getClients({}).subscribe(
			(resultData: any) => {
				Swal.close();
				if (resultData.code === 'success') {
					this.originalDealsList = resultData.detail;
					this.dealsList = (resultData.detail as any[]).map((clientItem) => {
						return {
							_id: clientItem._id,
							idNumber: clientItem.idNumber,
							companyName: clientItem.companyName,
							email: clientItem.email,
							phoneNumber: clientItem.phoneNumber,
							address: clientItem.address,
							comments: clientItem.comments,
							contacts: clientItem.contacts,
							isActive: clientItem.isActive,
							deals: clientItem.deals.map((dealItem: any) => {
								const formatedScheduleDate = `${
									dealItem.nextActionToTake.scheduleDate.split('T')[0]
								}T${dealItem.nextActionToTake.scheduleHour}:00.000z`;
								return {
									_id: dealItem._id,
									client: dealItem.client._id,
									referenceCode: dealItem.referenceCode,
									title: dealItem.title,
									comments: dealItem.comments,
									mediaUrls: dealItem.mediaUrls,
									teamMembers: dealItem.teamMembers,
									nextActionToTake: {
										_id: dealItem.nextActionToTake._id,
										scheduleDate: dealItem.nextActionToTake.scheduleDate,
										scheduleHour: dealItem.nextActionToTake.scheduleHour,
										dateHasPassed: moment(formatedScheduleDate).utc() < moment().utc(),
									},
									createdBy: dealItem.createdBy,
									createdDate: dealItem.createdDate,
									isArchived: dealItem.isArchived,
								};
							}),
						};
					});
					console.log(this.dealsList);
				} else {
					if (resultData.code === 'error') {
						Swal.fire({
							title: 'Error',
							text: 'Error al obtener los datos de clientes.\n'.concat(resultData.detail),
							icon: 'error',
							allowOutsideClick: false,
							allowEscapeKey: true,
							showClass: {
								popup: 'animate fadeInUp',
							},
						});
					}
				}
			},
			(error: any) => {
				Swal.fire({
					title: 'Error',
					text: 'Error al intentar obtener los datos de clientes.\n',
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
}
