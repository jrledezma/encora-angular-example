import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";
import * as ConstValues from "../../../constant-values";

import {
	ClientInterface,
	ClientWayOfEntryInterface,
	ServiceResultInterface,
} from "src/app/interfaces";
import {
	ClientCommunicationsTrackingService,
	ClientWayOfEntriesService,
	SessionCacheService,
	ConfigValuesService,
} from "../../services";
import { ClientCommunicationTrackingModalComponent } from "./client-communication-tracking-modal.component";
import { UserInfoDetailComponent } from "../modals/user-info-detail/user-info-detail.component";

@Component({
	selector: "app-client-communications-tracking",
	templateUrl: "./client-communications-tracking.component.html",
	styles: [],
})
export class ClientCommunicationsTrackingComponent implements OnInit {
	originalComunicationTrackingList: any[] = [];
	comunicationTrackingList: any[] = [];
	waysOfEntriesCollection: ClientWayOfEntryInterface[] = [];
	filterForm: FormGroup;
	userStatus: any = {};
	paginationOpt: any = {};
	clientTypeFilter = "all";

	private toast = ConstValues.Toast;

	constructor(
		private modalService: NgbModal,
		private clientTrackingSrv: ClientCommunicationsTrackingService,
		private waysOfEntrySrv: ClientWayOfEntriesService,
		private sessionCacheSrv: SessionCacheService,
		private router: Router,
		private configValuesSrv: ConfigValuesService
	) {
		this.sessionCacheSrv.getSessionData().subscribe((observer: any) => {});
	}

	ngOnInit() {
		this.configValuesSrv
			.getUserStatus()
			.subscribe((observer: ServiceResultInterface) => {
				if (observer.code === "success") {
					this.userStatus = observer.detail;
				}
			});
		this.getClientWayOfEntry();
		this.getData();
		this.filterForm = new FormGroup({
			clientIdNumber: new FormControl(""),
			clientCompanyName: new FormControl(""),
			clientEmail: new FormControl(""),
			cellPhone: new FormControl(""),
			communicationWay: new FormControl(""),
			communicationDate: new FormControl(""),
		});
		this.paginationOpt = {
			currentPage: 1,
			itemsPerPage: 4,
			maxSize: 5,
			directionLinks: true,
			autoHide: true,
			responsive: true,
			previousLabel: "Anterior",
			nextLabel: "Siguiente",
		};
	}

	filterChange(clientType: string) {
		if (this.originalComunicationTrackingList.length) {
			this.clientTypeFilter = clientType;
			this.comunicationTrackingList =
				this.originalComunicationTrackingList.filter((tracking) => {
					let returnedTracking: any = null;
					switch (clientType) {
						case "all":
							returnedTracking = tracking;
							break;
						case "own":
							if (tracking.ownClient) {
								returnedTracking = tracking;
							}
							break;
						case "external":
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

	private getClientWayOfEntry() {
		try {
			this.waysOfEntrySrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					if (response.code !== "success") {
						this.toast.fire({
							icon: "error",
							text: `Error al obtener los tamaños.\n ${response.detail}`,
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
					*/
					this.toast.fire({
						icon: "error",
						text: `Error al obtener los tamaños.\n ${error}`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: "error",
				text: `Error al obtener los tamaños.\n ${ex.message}`,
			});
		}
	}

	search() {
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
		const prvListLength = this.comunicationTrackingList.length;
		this.comunicationTrackingList = [];
		this.clientTrackingSrv.getClients(this.createFilterObject()).subscribe(
			(resultData: ServiceResultInterface) => {
				if (resultData.code === "error") {
					Swal.fire({
						title: "Error",
						text: "Error al obtener los datos.\n".concat(resultData.detail),
						icon: "error",
						allowOutsideClick: false,
						allowEscapeKey: true,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					return;
				}
				if (resultData.detail.length === 0) {
					Swal.fire({
						title: "Datos no Encontrados",
						text: "No fue posible encontrar datos con los filtros ingresados",
						icon: "warning",
						allowEscapeKey: true,
						allowOutsideClick: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					return;
				}
				Swal.close();
				this.originalComunicationTrackingList = resultData.detail;
				this.comunicationTrackingList = resultData.detail;
				this.filterChange(this.clientTypeFilter); 
				if (this.comunicationTrackingList.length !== prvListLength) {
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
					title: "Error",
					text: "Error al intentar obtener los datos.\n",
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

	openDetailModal(selectedId: ClientInterface) {
		const modalRef = this.modalService.open(
			ClientCommunicationTrackingModalComponent,
			{
				keyboard: false,
				backdrop: false,
				centered: true,
				size: "lg",
				windowClass: "animated fadeIn",
			}
		);
		if (selectedId) {
			modalRef.componentInstance.dataId = selectedId;
		}
		modalRef.result.then(
			(value: any) => {
				if (value) {
					this.search();
				}
			},
			() => {}
		);
	}

	goToDetail(clientId: string) {
		this.router.navigate(["clientstracking", clientId]);
	}

	pageChange(newPage: number) {
		this.paginationOpt.currentPage = newPage;
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
			filter.client.companyName =
				this.filterForm.controls.clientCompanyName.value;
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

	private getData() {
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
		this.clientTrackingSrv.getClients({}).subscribe(
			(resultData: any) => {
				Swal.close();
				if (resultData.code === "success") {
					this.originalComunicationTrackingList = resultData.detail;
					this.comunicationTrackingList = resultData.detail;
				} else {
					if (resultData.code === "error") {
						Swal.fire({
							title: "Error",
							text: "Error al obtener los datos de clientes.\n".concat(
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
					text: "Error al intentar obtener los datos de clientes.\n",
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
}
