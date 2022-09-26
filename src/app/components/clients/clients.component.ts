import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, FormBuilder } from "@angular/forms";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";
import * as ConstValues from "../../../constant-values";

import {
	ClientInterface,
	ClientWayOfEntryInterface,
	ServiceResultInterface,
} from "src/app/interfaces";
import {
	ClientsService,
	ClientWayOfEntriesService,
	SessionCacheService,
} from "../../services";
import { ClientModalComponent } from "./client-modal.component";

@Component({
	selector: "app-clients",
	templateUrl: "./clients.component.html",
	styles: [],
})
export class ClientsComponent implements OnInit {
	clientsList: ClientInterface[] = [];
	waysOfEntriesCollection: ClientWayOfEntryInterface[] = [];
	filterForm: FormGroup;
	paginationOpt: any = {};

	private toast = ConstValues.Toast;

	constructor(
		private modalService: NgbModal,
		private clientsSrv: ClientsService,
		private formBuilder: FormBuilder,
		private waysOfEntrySrv: ClientWayOfEntriesService,
		private sessionCacheSrv: SessionCacheService
	) {
		this.sessionCacheSrv.getSessionData().subscribe((observer: any) => {});
	}

	ngOnInit() {
		this.getClientWayOfEntry();
		this.getData();
		this.filterForm = new FormGroup({
			idNumber: new FormControl(""),
			companyName: new FormControl(""),
			email: new FormControl(""),
			cellPhone: new FormControl(""),
			wayOfEntry: new FormControl(""),
			dateOfEntry: new FormControl(""),
			isActive: new FormControl(""),
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
					if (error === "unauthorized") {
						this.toast.fire({
							icon: "error",
							html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
						});
						return;
					}
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
		const prvListLength = this.clientsList.length;
		this.clientsList = [];
		this.clientsSrv.search(this.createFilterObject()).subscribe(
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
				this.clientsList = resultData.detail;
				if (this.clientsList.length !== prvListLength) {
					this.paginationOpt.currentPage = 1;
				}
			},
			(error: any) => {
				if (error === "unauthorized") {
					this.toast.fire({
						icon: "error",
						html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
					});
					return;
				}
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
		const modalRef = this.modalService.open(ClientModalComponent, {
			keyboard: false,
			backdrop: false,
			centered: true,
			size: "lg",
			windowClass: "animated fadeIn",
		});
		if (selectedId) {
			modalRef.componentInstance.dataId = selectedId;
		}
		modalRef.result.then(
			(value: any) => {
				this.search();
			},
			() => {}
		);
	}

	activateRecord(saleChannelId: string, currentStatus: boolean) {
		try {
			Swal.fire({
				title: currentStatus ? "Inactivar Datos" : "Activar Datos",
				text: currentStatus
					? "Desea inactivar los datos seleccionados?"
					: "Desea activar los datos seleccionados?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: currentStatus ? "Inactivar" : "Activar",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then((result) => {
				Swal.close();
				if (result.value) {
					Swal.fire({
						title: currentStatus ? "Inactivando Datos" : "Activando Datos",
						text: currentStatus
							? "Se estan inactivando los datos, por favor espere"
							: "Se estan activando los datos, por favor espere",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();
					if (currentStatus) {
						this.clientsSrv.inactivate(saleChannelId).subscribe(
							(resultData: ServiceResultInterface) => {
								if (resultData.code !== "success") {
									this.toast.fire({
										icon: "error",
										text: "Error al intentar inactivar los datos.\n".concat(
											resultData.detail
										),
									});
								} else {
									Swal.close();
									this.search();
									this.toast.fire({
										icon: "success",
										text: "Registro inactivado correctamente",
									});
								}
							},
							(error: any) => {
								if (error === "unauthorized") {
									this.toast.fire({
										icon: "error",
										html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
									});
									return;
								}
								Swal.fire({
									title: "Error",
									text: "Error al intentar inactivar los datos.\n",
									icon: "error",
									allowOutsideClick: false,
									allowEscapeKey: true,
									showClass: {
										popup: "animate fadeInUp",
									},
								});
							}
						);
					} else {
						this.clientsSrv.activate(saleChannelId).subscribe(
							(resultData: ServiceResultInterface) => {
								if (resultData.code !== "success") {
									this.toast.fire({
										icon: "error",
										text: "Error al intentar inactivar los datos.\n".concat(
											resultData.detail
										),
									});
								} else {
									Swal.close();
									this.search();
									this.toast.fire({
										icon: "success",
										text: "Registro inactivado correctamente",
									});
								}
							},
							(error: any) => {
								if (error === "unauthorized") {
									this.toast.fire({
										icon: "error",
										html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
									});
									return;
								}
								Swal.fire({
									title: "Error",
									text: "Error al intentar activar los datos.\n",
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

	pageChange(newPage: number) {
		this.paginationOpt.currentPage = newPage;
	}

	private createFilterObject(): any {
		let filter: any = {};
		if (this.filterForm.controls.idNumber.value) {
			filter.idNumber = this.filterForm.controls.idNumber.value;
		}
		if (this.filterForm.controls.companyName.value) {
			filter.companyName = this.filterForm.controls.companyName.value;
		}
		if (this.filterForm.controls.email.value) {
			filter.email = this.filterForm.controls.email.value;
		}
		if (this.filterForm.controls.cellPhone.value) {
			filter.cellPhone = this.filterForm.controls.cellPhone.value;
		}
		if (this.filterForm.controls.wayOfEntry.value) {
			filter.wayOfEntry = this.filterForm.controls.wayOfEntry.value;
		}
		if (
			this.filterForm.controls.isActive.value !== "" &&
			this.filterForm.controls.isActive.value !== null
		) {
			filter.isActive = this.filterForm.controls.isActive.value === true;
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
		this.clientsSrv.getAll().subscribe(
			(resultData: any) => {
				Swal.close();
				if (resultData.code === "success") {
					Swal.close();
					this.clientsList = resultData.detail;
					return;
				} else {
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
					}
				}
			},
			(error: any) => {
				Swal.close();
				if (error === "unauthorized") {
					this.toast.fire({
						icon: "error",
						html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
					});
					return;
				}
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
}
