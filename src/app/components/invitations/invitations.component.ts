import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import Swal from "sweetalert2";
import * as ConstValues from "../../../constant-values";
import { ServiceResultInterface } from "../../interfaces/service-result.interface";
import { ClientCommunicationTrackingInvitationInterface, ClientInterface } from "src/app/interfaces";
import { ClientCommunicationInvitationsService } from "../../services/client-communication-invitations.service";
import { ConfigValuesService, SessionCacheService } from "src/app/services";
import { Router } from "@angular/router";
import { UserInfoDetailComponent } from "../modals/user-info-detail/user-info-detail.component";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { countryList } from "../../../constant-values";
import { ClientCommunicationTrackingModalComponent } from "../client-communications-tracking/client-communication-tracking-modal.component";

@Component({
	selector: "app-invitations",
	templateUrl: "./invitations.component.html",
	styleUrls: ["./invitations.component.css"],
})
export class InvitationsComponent implements OnInit {
	invitationsList: ClientCommunicationTrackingInvitationInterface[] = [];
	rawInvitationsList: ClientCommunicationTrackingInvitationInterface[] = [];
	userAs = "stakeholder";
	userStatus: any = {};
	filterForm: FormGroup;
	showDataNotFound = false;
	invitationStatusList = [
		{
			key: "accepted",
			value: "Aceptada",
		},
		{
			key: "rejected",
			value: "Rechazada",
		},
		{
			key: "requested",
			value: "Solicitada",
		},
		{
			key: "revoked",
			value: "Revocada",
		},
	];
	countryList = countryList;

	private toast = ConstValues.Toast;

	constructor(
		private invitationsSrv: ClientCommunicationInvitationsService,
		private configValuesSrv: ConfigValuesService,
		private router: Router,
		private modalService: NgbModal,
		private sessionCacheSrv: SessionCacheService
	) {}

	ngOnInit() {
		this.configValuesSrv
			.getUserStatus()
			.subscribe((observer: ServiceResultInterface) => {
				if (observer.code === "success") {
					this.userStatus = observer.detail;
				}
			});
		this.filterForm = new FormGroup({
			invitationStatus: new FormControl(""),
			email: new FormControl(""),
		});
		this.getInvitationsAsStakeholder();
	}

	filterChange(newStatus: string) {
		this.userAs = newStatus;
		switch (newStatus) {
			case "stakeholder":
				this.getInvitationsAsStakeholder();
				break;
			case "invitedby":
				this.getInvitationsAsInvitedBy();
				break;
		}
	}

	search() {
		if (
			!this.filterForm.controls.invitationStatus.value &&
			!this.filterForm.controls.email.value
		) {
			switch (this.userAs) {
				case "invitedby":
					this.getInvitationsAsInvitedBy();
					break;
				case "stakeholder":
					this.getInvitationsAsStakeholder();
					break;
			}
			return;
		}
		this.invitationsList = this.rawInvitationsList.filter((invitation) => {
			if (
				this.filterForm.controls.invitationStatus.value &&
				!this.filterForm.controls.email.value
			) {
				if (
					invitation.invitationStatus ===
					this.filterForm.controls.invitationStatus.value
				) {
					return invitation;
				}
			} else {
				if (
					!this.filterForm.controls.invitationStatus.value &&
					this.filterForm.controls.email.value
				) {
					if (
						invitation[this.getSearchEmailType()].email.includes(
							this.filterForm.controls.email.value
						)
					) {
						return invitation;
					}
				}
				if (
					this.filterForm.controls.invitationStatus.value &&
					this.filterForm.controls.email.value
				) {
					if (
						invitation.invitationStatus ===
							this.filterForm.controls.invitationStatus.value &&
						invitation[this.getSearchEmailType()].email.includes(
							this.filterForm.controls.email.value
						)
					) {
						return invitation;
					}
				}
			}
		});
		this.showDataNotFound = !(this.invitationsList.length > 0);
	}

	openUserInfoDetailModal(selectedUser: any) {
		selectedUser.fullName = `${selectedUser.firstName} ${selectedUser.lastName}`;
		const modalRef = this.modalService.open(UserInfoDetailComponent, {
			keyboard: false,
			backdrop: false,
			centered: true,
			size: "lg",
			windowClass: "animated fadeIn",
		});
		if (selectedUser) {
			modalRef.componentInstance.userInfo = { ...selectedUser };
		}
	}

	acceptInvitation(invitationId: string, trackingId: string) {
		try {
			Swal.fire({
				title: "Aceptar Invitación",
				text: "¿Desea aceptar la invitación seleccionada?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Aceptar",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then(
				(result) => {
					if (result.value) {
						Swal.fire({
							title: "Aceptando Invitación",
							text: "Se está aceptando la invitación, por favor espere",
							icon: "info",
							allowOutsideClick: false,
							allowEscapeKey: false,
							allowEnterKey: false,
							showClass: {
								popup: "animate fadeInUp",
							},
						});
						Swal.showLoading();
						this.invitationsSrv.acceptInvitation(invitationId).subscribe(
							(observer) => {
								Swal.close();
								if (observer.code !== "success") {
									this.toast.fire({
										icon: "error",
										text: 'Sucedió un error al aceptar la invitación',
									});
									return;
								}
								this.sessionCacheSrv.setInvitationsQtt(
									this.invitationsList.length - 1
								);
								this.toast.fire({
									icon: "success",
									text: 'La Invitación ha sido aceptada',
								});
								this.router.navigate(["clienttrackingdetail", trackingId]);
								return;
							},
							(error: any) => {
								/*
								if (error === "unauthorized") {
									this.toast.fire({
										icon: "error",
										text: 'La sesión ha finalizado',
									});
									this.router.navigate(["/"]);
									return;
								}
								*/
								this.toast.fire({
									icon: "error",
									text: 'Sucedió un error al aceptar la invitación',
								});
							}
						);
					}
				},
				(error) => {
					Swal.close();
					this.toast.fire({
						icon: "error",
						text: 'Sucedió un error al aceptar la invitación',
					});
				}
			);
		} catch (ex) {
			Swal.close();
			this.toast.fire({
				icon: "error",
				text: 'Sucedió un error al aceptar la invitación',
			});
		}
	}

	rejectInvitation(invitationId: string) {
		try {
			Swal.fire({
				title: "Rechazar Invitación",
				text: "¿Desea rechazar la invitación seleccionada?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Aceptar",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: "Rechazando Invitación",
						text: "Se está rechazando la invitación, por favor espere",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();
					this.invitationsSrv.rejectInvitation(invitationId).subscribe(
						(observer) => {
							Swal.close();
							if (observer.code !== "success") {
								this.toast.fire({
									icon: "error",
									text: 'Sucedió un error al rechazar la invitación',
								});
								return;
							}
							this.toast.fire({
								icon: "success",
								text: 'La Invitación ha sido rechazada',
							});
							this.getInvitationsAsStakeholder();
							return;
						},
						(error: any) => {
							/*
							if (error === "unauthorized") {
								this.toast.fire({
									icon: "error",
									text: 'La sesión ha finalizado',
								});
								this.router.navigate(["/"]);
								return;
							}
							*/
							this.toast.fire({
								icon: "error",
								text: 'Sucedió un error al rechazar la invitación',
							});
						}
					);
				}
			});
		} catch (error) {
			Swal.close();
			this.toast.fire({
				icon: "error",
				text: 'Sucedió un error al aceptar la invitación',
			});
		}
	}

	leaveInvitation(invitationId: string) {
		try {
			Swal.fire({
				title: "Abandonar Seguimiento",
				text: "¿Desea abandonar el seguimiento asociado a la invitación seleccionada?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Aceptar",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: "Abandonando Seguimiento",
						text: "Dejando el seguimiento, por favor espere",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();
					this.invitationsSrv.leaveInvitation(invitationId).subscribe(
						(observer) => {
							Swal.close();
							if (observer.code !== "success") {
								this.toast.fire({
									icon: "error",
									text: '<h6 class="ml-3 mt-1">Sucedió un error al abandonar el seguimiento',
								});
								return;
							}
							this.toast.fire({
								icon: "success",
								text: '<h6 class="ml-3 mt-1">Se ha abandonado el seguimiento con éxito',
							});
							this.getInvitationsAsStakeholder();
							return;
						},
						(error: any) => {
							/*
							if (error === "unauthorized") {
								this.toast.fire({
									icon: "error",
									text: 'La sesión ha finalizado',
								});
								this.router.navigate(["/"]);
								return;
							}
							*/
							this.toast.fire({
								icon: "error",
								text: 'Sucedió un error al rechazar la invitación',
							});
						}
					);
				}
			});
		} catch (error) {
			Swal.close();
			this.toast.fire({
				icon: "error",
				text: 'Sucedió un error al aceptar la invitación',
			});
		}
	}

	revokeInvitation(invitationId: string) {
		try {
			Swal.fire({
				title: "Revocar Invitación",
				text: "¿Desea revocar la invitación seleccionada?",
				icon: "question",
				allowOutsideClick: false,
				allowEscapeKey: true,
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				confirmButtonText: "Aceptar",
				showClass: {
					popup: "animated fadeInUp",
				},
			}).then((result) => {
				if (result.value) {
					Swal.fire({
						title: "Revocando Invitación",
						text: "Se está revocando la invitación, por favor espere",
						icon: "info",
						allowOutsideClick: false,
						allowEscapeKey: false,
						allowEnterKey: false,
						showClass: {
							popup: "animate fadeInUp",
						},
					});
					Swal.showLoading();

					this.invitationsSrv.revokeInvitation(invitationId).subscribe(
						(observer) => {
							if (observer.code !== "success") {
								this.toast.fire({
									icon: "error",
									text: 'Sucedió un error al revocar la invitación',
								});
								return;
							}
							this.sessionCacheSrv.setInvitationsQtt(
								this.invitationsList.length - 1
							);
							this.toast.fire({
								icon: "success",
								text: 'La Invitación ha sido revocada',
							});
							this.getInvitationsAsInvitedBy();
							return;
						},
						(error: any) => {
							/*
							if (error === "unauthorized") {
								this.toast.fire({
									icon: "error",
									text: 'La sesión ha finalizado',
								});
								this.router.navigate(["/"]);
								return;
							}
							*/
							this.toast.fire({
								icon: "error",
								text: 'Sucedió un error al revocar la invitación',
							});
						}
					);
				}
			});
		} catch (error) {
			this.toast.fire({
				icon: "error",
				text: 'Sucedió un error al revocar la invitación',
			});
		}
	}

	openTrackingDetailModal(selectedId: string) {
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

	private getInvitationsAsStakeholder() {
		try {
			Swal.fire({
				title: "Obteniendo Datos",
				text: "Buscando invitaciones asociadas a tu cuenta, por favor espera",
				icon: "info",
				allowOutsideClick: false,
				allowEscapeKey: false,
				allowEnterKey: false,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
			Swal.showLoading();
			this.invitationsList = [];
			this.invitationsSrv.getAsStakeholder().subscribe(
				(observer: ServiceResultInterface) => {
					this.showDataNotFound = false;
					if (observer.code !== "success") {
						if (observer.code === "notDataFound") {
							this.showDataNotFound = true;
							this.toast.fire({
								icon: "info",
								text: `No se encontraron invitaciones recibidas`,
							});
						} else {
							this.toast.fire({
								icon: "error",
								text: `Error al obtener las invitaciones recibidas`,
							});
						}
						return;
					}
					Swal.close();
					this.rawInvitationsList = (observer.detail as any[]).map(
						(invitation) => {
							return {
								_id: invitation._id,
								communicationTracking: invitation.communicationTracking,
								invitationDate: invitation.invitationDate,
								invitationStatus: invitation.invitationStatus,
								invitedby: {
									_id: invitation.invitedby._id,
									about: invitation.invitedby.about,
									countryCode: invitation.invitedby.countryCode,
									countryName: this.getCountryInfo(
										invitation.invitedby.countryCode,
										"name"
									),
									email: invitation.invitedby.email,
									firstName: invitation.invitedby.firstName,
									lastName: invitation.invitedby.lastName,
									image: invitation.invitedby.image,
									phoneNumber: invitation.invitedby.phoneNumber,
									status: invitation.invitedby.status,
								},
								stakeholder: {
									_id: invitation.invitedby._id,
									about: invitation.invitedby.about,
									countryCode: invitation.invitedby.countryCode,
									countryName: this.getCountryInfo(
										invitation.invitedby.countryCode,
										"name"
									),
									email: invitation.invitedby.email,
									firstName: invitation.stakeholder.firstName
										? invitation.stakeholder.firstName
										: "Usuario no Confirmado",
									lastName: invitation.stakeholder.lastName
										? invitation.stakeholder.lastName
										: null,
									image: invitation.invitedby.image,
									phoneNumber: invitation.invitedby.phoneNumber,
									status: invitation.invitedby.status,
								},
							};
						}
					);
					this.invitationsList = this.rawInvitationsList;
					this.showDataNotFound = !(this.invitationsList.length > 0);
				},
				(error: any) => {
					/*
					if (error === "unauthorized") {
						this.toast.fire({
							icon: "error",
							text: 'La sesión ha finalizado',
						});
						return;
					}
					*/
					this.toast.fire({
						icon: "error",
						text: `Error al obtener las invitaciones asociadas a tu cuenta`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: "error",
				text: `Error al obtener las invitaciones asociadas a tu cuenta`,
			});
		}
	}

	private getInvitationsAsInvitedBy() {
		try {
			Swal.fire({
				title: "Obteniendo Datos",
				text: "Buscando invitaciones asociadas a tu cuenta, por favor espera",
				icon: "info",
				allowOutsideClick: false,
				allowEscapeKey: false,
				allowEnterKey: false,
				showClass: {
					popup: "animate fadeInUp",
				},
			});
			Swal.showLoading();
			this.invitationsList = [];
			this.invitationsSrv.getAsInvitedBy().subscribe(
				(observer: ServiceResultInterface) => {
					this.showDataNotFound = false;
					if (observer.code !== "success") {
						if (observer.code === "notDataFound") {
							this.toast.fire({
								icon: "info",
								text: `No se encontraron invitaciones enviadas`,
							});
							this.showDataNotFound = true;
						} else {
							this.toast.fire({
								icon: "error",
								text: `Error al obtener las invitaciones enviadas`,
							});
						}
						return;
					}
					Swal.close();
					this.rawInvitationsList = (observer.detail as any[]).map(
						(invitation) => {
							return {
								_id: invitation._id,
								communicationTracking: invitation.communicationTracking,
								invitationDate: invitation.invitationDate,
								invitationStatus: invitation.invitationStatus,
								invitedby: {
									_id: invitation.invitedby._id,
									about: invitation.invitedby.about,
									countryCode: invitation.invitedby.countryCode,
									countryName: this.getCountryInfo(
										invitation.invitedby.countryCode,
										"name"
									),
									email: invitation.invitedby.email,
									fullName: `${invitation.invitedby.firstName} ${invitation.invitedby.lastName}`,
									image: invitation.invitedby.image,
									phoneNumber: invitation.invitedby.phoneNumber,
									status: invitation.invitedby.status,
								},
								stakeholder: {
									_id: invitation.stakeholder._id,
									about: invitation.stakeholder.about,
									countryCode: invitation.stakeholder.countryCode,
									countryName: invitation.stakeholder.countryCode
										? this.getCountryInfo(
												invitation.stakeholder.countryCode,
												"name"
										  )
										: null,
									email: invitation.stakeholder.email,
									firstName: invitation.stakeholder.firstName
										? invitation.stakeholder.firstName
										: "Usuario no Confirmado",
									lastName: invitation.stakeholder.lastName
										? invitation.stakeholder.lastName
										: null,
									image:
										invitation.stakeholder.image ||
										"https://absque-public-stuff.s3.amazonaws.com/clifoll/user_icon_status_created.png",
									phoneNumber: invitation.stakeholder.phoneNumber,
									status: invitation.stakeholder.status,
								},
							};
						}
					);
					this.invitationsList = this.rawInvitationsList;
					this.showDataNotFound = !(this.invitationsList.length > 0);
				},
				(error: any) => {
					/*
					if (error === "unauthorized") {
						this.toast.fire({
							icon: "error",
							text: 'La sesión ha finalizado',
						});
						return;
					}
					*/
					this.toast.fire({
						icon: "error",
						text: `Error al obtener las invitaciones asociadas a tu cuenta`,
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: "error",
				text: `Error al obtener las invitaciones asociadas a tu cuenta`,
			});
		}
	}

	private getSearchEmailType(): string {
		return this.userAs === "stakeholder" ? "invitedby" : "stakeholder";
	}

	private getCountryInfo(countryCode, requestedValue: string): string {
		const returnValue = this.countryList.filter((country) => {
			if (country.code === countryCode) {
				return country;
			}
		})[0][requestedValue];
		return returnValue;
	}
}
