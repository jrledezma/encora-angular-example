import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as ConstValues from "../../../constant-values";

import { ClientCommunicationInvitationsService } from "../../services/client-communication-invitations.service";

@Component({
	selector: "app-client-communications-tracking-invitation-detail",
	templateUrl:
		"./client-communications-tracking-invitation-detail.component.html",
	styleUrls: [
		"./client-communications-tracking-invitation-detail.component.css",
	],
})
export class ClientCommunicationsTrackingInvitationDetailComponent
	implements OnInit
{
	invitationData: any = {};
	private invitationId = "";
	private toast = ConstValues.Toast;

	constructor(
		private modalService: NgbModal,
		private route: ActivatedRoute,
		private router: Router,
		private invitationsSrv: ClientCommunicationInvitationsService
	) {}

	ngOnInit() {
		this.route.paramMap.subscribe((params) => {
			this.invitationId = params.get("invitationId");
			this.getInvitationData();
		});
	}

	acceptInvitation() {
		try {
			this.invitationsSrv.acceptInvitation(this.invitationData._id).subscribe(
				(observer) => {
					if (observer.code !== "success") {
						this.toast.fire({
							icon: "error",
							html: '<h6 class="ml-3 mt-1">Sucedió un error al aceptar la invitación</h6>',
						});
						return;
					}
					this.toast.fire({
						icon: "success",
						html: '<h6 class="ml-3 mt-1">La Invitación ha sido aceptada</h6>',
					});
					this.router.navigate([
						"clienttrackingdetail",
						this.invitationData.communicationTracking._id,
					]);
					return;
				},
				(error: any) => {
					/*
					if (error === "unauthorized") {
						this.toast.fire({
							icon: "error",
							html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
						});
						this.router.navigate(["/"]);
						return;
					}
					*/
					this.toast.fire({
						icon: "error",
						html: '<h6 class="ml-3 mt-1">Sucedió un error al aceptar la invitación</h6>',
					});
				}
			);
		} catch (error) {
			this.toast.fire({
				icon: "error",
				html: '<h6 class="ml-3 mt-1">Sucedió un error al aceptar la invitación</h6>',
			});
		}
	}

	rejectInvitation() {
		try {
			this.invitationsSrv.rejectInvitation(this.invitationData._id).subscribe(
				(observer) => {
					if (observer.code !== "success") {
						this.toast.fire({
							icon: "error",
							html: '<h6 class="ml-3 mt-1">Sucedió un error al rechazar la invitación</h6>',
						});
						return;
					}
					this.toast.fire({
						icon: "success",
						html: '<h6 class="ml-3 mt-1">La Invitación ha sido rechazada</h6>',
					});
					this.router.navigate([
						"/"
					]);
					return;
				},
				(error: any) => {
					/*
					if (error === "unauthorized") {
						this.toast.fire({
							icon: "error",
							html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
						});
						this.router.navigate(["/"]);
						return;
					}
					*/
					this.toast.fire({
						icon: "error",
						html: '<h6 class="ml-3 mt-1">Sucedió un error al rechazar la invitación</h6>',
					});
				}
			);
		} catch (error) {
			this.toast.fire({
				icon: "error",
				html: '<h6 class="ml-3 mt-1">Sucedió un error al aceptar la invitación</h6>',
			});
		}
	}

	private getInvitationData() {
		try {
			this.invitationsSrv.getById(this.invitationId).subscribe(
				(observer) => {
					if (observer.code !== "success") {
						this.toast.fire({
							icon: "error",
							html: '<h6 class="ml-3 mt-1">Sucedió un error al obtener los datos</h6>',
						});
						return;
					}
					this.invitationData = observer.detail;
				},
				(error: any) => {
					/*
					if (error === "unauthorized") {
						this.toast.fire({
							icon: "error",
							html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>',
						});
						this.router.navigate(["/"]);
						return;
					}
					*/
					this.toast.fire({
						icon: "error",
						html: '<h6 class="ml-3 mt-1">Sucedió un error al obtener los datos</h6>',
					});
				}
			);
		} catch (ex) {
			this.toast.fire({
				icon: "error",
				html: '<h6 class="ml-3 mt-1">Sucedió un error al obtener los datos</h6>',
			});
		}
	}
}
