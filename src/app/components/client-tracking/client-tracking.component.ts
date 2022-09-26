import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";
import * as ConstValues from "../../../constant-values";

import {
	ClientCommunicationWayInterface,
	ServiceResultInterface,
} from "src/app/interfaces";
import {
	ClientCommunicationsTrackingService,
	ClientCommunicationWaysService,
	SessionCacheService,
} from "../../services";
import { ClientCommunicationTrackingModalComponent } from "../client-communications-tracking/client-communication-tracking-modal.component";

@Component({
	selector: "app-client-tracking-detail",
	templateUrl: "./client-tracking.component.html",
	styles: [],
})
export class ClientTrackingComponent implements OnInit {
	clientTrackingDetail: any = {};
	clientCommunicationsCollection: any[] = [];
	clientNotesCollection: any[] = [];
	waysOfEntriesCollection: ClientCommunicationWayInterface[] = [];
	communicationFilterForm: FormGroup;
	notesFilterForm: FormGroup;
	paginationOptForNotes: any = {};
	paginationOptForCommuincations: any = {};
	clientId: string = "";
	gotCommunications: boolean = false;
	gotNotes: boolean = false;
	trackingStatus = "all";

	private toast = ConstValues.Toast;

	constructor(
		public router: Router,
		private modalService: NgbModal,
		private clientTrackingSrv: ClientCommunicationsTrackingService,
		private formBuilder: FormBuilder,
		private waysOfCommunicationSrv: ClientCommunicationWaysService,
		private sessionCacheSrv: SessionCacheService,
		private route: ActivatedRoute
	) {
		this.sessionCacheSrv.getSessionData().subscribe((observer: any) => {});
	}

	ngOnInit() {
		this.getTrackingInfo();
		this.communicationFilterForm = new FormGroup({
			communicationWay: new FormControl(""),
			communicationDate: new FormControl(""),
		});
		this.notesFilterForm = new FormGroup({
			noteTitle: new FormControl(""),
			noteDescription: new FormControl(""),
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

		this.paginationOptForNotes = { ...paginationOptions };
		this.paginationOptForCommuincations = { ...paginationOptions };

		this.route.paramMap.subscribe((params) => {
			this.clientId = params.get("clientId");
			this.search();
		});
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
		const previewCommunicationsListLength =
			this.clientCommunicationsCollection.length;
		const previewNotesListLength = this.clientNotesCollection.length;
		this.clientTrackingDetail = [];
		this.clientTrackingSrv.getTrackingHistoryByClient(this.clientId).subscribe(
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
				this.clientTrackingDetail = resultData.detail;
				//filtering communications record
				this.clientCommunicationsCollection =
					this.clientTrackingDetail.recordHistory.filter(
						(item) => item.trackingType._id === "0001"
					);
				this.gotCommunications = this.clientCommunicationsCollection.length > 0;
				if (
					this.clientCommunicationsCollection.length !==
					previewCommunicationsListLength
				) {
					this.paginationOptForCommuincations.currentPage = 1;
				}

				//filtering notes records
				this.clientNotesCollection =
					this.clientTrackingDetail.recordHistory.filter((item) => {
						if (
							item.trackingType._id === "0002" ||
							item.trackingType._id === "0003"
						) {
							return item;
						}
					});
				this.gotNotes = this.clientNotesCollection.length > 0;
				if (this.clientNotesCollection.length !== previewNotesListLength) {
					this.paginationOptForNotes.currentPage = 1;
				}
				this.filterChange(this.trackingStatus);
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

	openDetailModal(selectedId: string) {
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
		modalRef.componentInstance.dataId = selectedId;
		modalRef.result.then(
			(value: any) => {
				this.search();
			},
			() => {}
		);
	}

	openNewCommunicationModal(communicationType?: string) {
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
		modalRef.componentInstance.clientId = this.clientTrackingDetail.client._id;
		modalRef.componentInstance.communicationType = communicationType;
		modalRef.result.then(
			(value: any) => {
				this.search();
			},
			() => {}
		);
	}

	filterCommunicationHistory() {
		if (
			(this.communicationFilterForm.controls.communicationWay.value === null ||
				this.communicationFilterForm.controls.communicationWay.value === "") &&
			(this.communicationFilterForm.controls.communicationDate.value === null ||
				this.communicationFilterForm.controls.communicationDate.value === "")
		) {
			this.clientCommunicationsCollection =
				this.clientTrackingDetail.recordHistory.filter(
					(item) => item.trackingType._id === "0001"
				);
			return;
		}

		this.clientCommunicationsCollection =
			this.clientTrackingDetail.recordHistory.filter((item) => {
				if (item.trackingType._id == "0001") {
					if (
						!this.communicationFilterForm.controls.communicationDate.value &&
						this.communicationFilterForm.controls.communicationWay.value &&
						item.clientCommunicationWay._id ===
							this.communicationFilterForm.controls.communicationWay.value
					) {
						return item;
					}
					if (
						!this.communicationFilterForm.controls.communicationWay.value &&
						this.communicationFilterForm.controls.communicationDate.value &&
						item.communicationDate ===
							`${this.communicationFilterForm.controls.communicationDate.value}T00:00:00.000Z`
					) {
						return item;
					}
					if (
						this.communicationFilterForm.controls.communicationWay.value &&
						item.clientCommunicationWay._id ===
							this.communicationFilterForm.controls.communicationWay.value &&
						this.communicationFilterForm.controls.communicationDate.value &&
						item.communicationDate ===
							`${this.communicationFilterForm.controls.communicationDate.value}T00:00:00.000Z`
					) {
						return item;
					}
				}
			});
		this.filterChange(this.trackingStatus)
	}

	filterNotesHistory() {
		if (
			(this.notesFilterForm.controls.noteTitle.value === null ||
				this.notesFilterForm.controls.noteTitle.value === "") &&
			(this.notesFilterForm.controls.noteDescription.value === null ||
				this.notesFilterForm.controls.noteDescription.value === "")
		) {
			this.clientNotesCollection =
				this.clientTrackingDetail.recordHistory.filter((item) => {
					if (
						item.trackingType._id === "0002" ||
						item.trackingType._id === "0003"
					) {
						return item;
					}
				});
			return;
		}

		this.clientNotesCollection = this.clientTrackingDetail.recordHistory.filter(
			(item: any) => {
				if (
					item.trackingType._id === "0002" ||
					item.trackingType._id === "0003"
				) {
					if (
						!this.notesFilterForm.controls.noteDescription.value &&
						this.notesFilterForm.controls.noteTitle.value &&
						item.title.includes(this.notesFilterForm.controls.noteTitle.value)
					) {
						return item;
					}
					if (
						!this.notesFilterForm.controls.noteTitle.value &&
						this.notesFilterForm.controls.noteDescription.value &&
						item.comments.includes(
							this.notesFilterForm.controls.noteDescription.value
						)
					) {
						return item;
					}
					if (
						this.notesFilterForm.controls.noteTitle.value &&
						item.title.includes(
							this.notesFilterForm.controls.noteTitle.value
						) &&
						this.notesFilterForm.controls.noteDescription.value &&
						item.comments.includes(
							this.notesFilterForm.controls.noteDescription.value
						)
					) {
						return item;
					}
				}
			}
		);
	}

	notesPageChange(newPage: number) {
		this.paginationOptForNotes.currentPage = newPage;
	}

	communicationPageChange(newPage: number) {
		this.paginationOptForCommuincations.currentPage = newPage;
	}

	archiveAction(tracking: any) {
		try {
			if (this.clientTrackingDetail.client.ownClient) {
				if (tracking.isArchived) {
					this.clientTrackingSrv.unarchive(tracking._id).subscribe(
						(observer) => {
							if (observer.code !== "success") {
								this.toast.fire({
									icon: "error",
									text: "No es posible Desarchivar el Seguimiento seleccionado",
								});
								return;
							}
							tracking.isArchived = false;
						},
						(error) => {
							this.toast.fire({
								icon: "error",
								text: "No es posible Desarchivar el Seguimiento seleccionado",
							});
							return;
						}
					);
				} else {
					this.clientTrackingSrv.archive(tracking._id).subscribe(
						(observer) => {
							if (observer.code !== "success") {
								this.toast.fire({
									icon: "error",
									text: "No es posible Archivar el Seguimiento seleccionado",
								});
								return;
							}
							tracking.isArchived = true;
						},
						(error) => {
							this.toast.fire({
								icon: "error",
								text: "No es posible Desarchivar el Seguimiento seleccionado",
							});
							return;
						}
					);
					return;
				}
			}
		} catch (ex) {
			this.toast.fire({
				icon: "error",
				text: "No es posible Archivar el Seguimiento seleccionado",
			});
		}
	}

	filterChange(filter: string) {
		this.trackingStatus = filter;
		if (filter === "all") {
			this.clientCommunicationsCollection =
				this.clientTrackingDetail.recordHistory.filter((tracking) => {
					if (tracking.trackingType._id === "0001") {
						return tracking;
					}
				});
			this.clientNotesCollection =
				this.clientTrackingDetail.recordHistory.filter((tracking) => {
					if (tracking.trackingType._id !== "0001") {
						return tracking;
					}
				});
		} else {
			this.clientCommunicationsCollection =
				this.clientTrackingDetail.recordHistory.filter((tracking) => {
					if (tracking.trackingType._id === "0001") {
						if (filter === "active" && !tracking.isArchived) {
							return tracking;
						}
						if (filter === "archived" && tracking.isArchived) {
							return tracking;
						}
					}
				});
			this.clientNotesCollection =
				this.clientTrackingDetail.recordHistory.filter((tracking) => {
					if (tracking.trackingType._id !== "0001") {
						if (filter === "active" && !tracking.isArchived) {
							return tracking;
						}
						if (filter === "archived" && tracking.isArchived) {
							return tracking;
						}
					}
				});
		}
	}

	private createFilterObject(): any {
		let filter: any = {
			client: {},
			communication: {},
		};
		if (this.communicationFilterForm.controls.communicationWay.value) {
			filter.communication.clientCommunicationWay =
				this.communicationFilterForm.controls.communicationWay.value;
		}
		if (this.communicationFilterForm.controls.communicationDate.value) {
			filter.communication.communicationDate =
				this.communicationFilterForm.controls.communicationDate.value;
		}
		return filter;
	}

	private getTrackingInfo() {
		try {
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
			this.waysOfCommunicationSrv.search({ isActive: true }).subscribe(
				(response: ServiceResultInterface) => {
					Swal.close();
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
					}
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
}
