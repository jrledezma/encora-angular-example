import { Component, OnInit } from '@angular/core';
import { Location } from "@angular/common";
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import * as ConstValues from '../../../../constant-values';

import {
  ClientInterface,
  ClientWayOfEntryInterface,
  ServiceResultInterface
} from 'src/app/interfaces';
import {
  ClientsService,
  ClientWayOfEntriesService,
  SessionCacheService
} from '../../../services';

@Component({
  selector: 'app-client-search-modal',
  templateUrl: './client-search-modal.component.html',
  styles: []
})
export class ClientSearchModalComponent implements OnInit {
  clientsList: ClientInterface[] = [];
  waysOfEntriesCollection: ClientWayOfEntryInterface[] = [];
  filterForm: FormGroup;
  paginationOpt: any = {};

  private toast = ConstValues.Toast;

  constructor(
    public activeModal: NgbActiveModal,
    private clientsSrv: ClientsService,
    private waysOfEntrySrv: ClientWayOfEntriesService,
    private sessionCacheSrv: SessionCacheService,
    private formBuilder: FormBuilder,
		private location: Location
  ) {
    this.sessionCacheSrv.getSessionData().subscribe((observer: any) => {});
    this.location.subscribe((location) => {
			// ...close popup
			this.activeModal.close();
		});
  }

  ngOnInit() {
    this.getClientWayOfEntry();
    this.getData();
    this.filterForm = new FormGroup({
      idNumber: new FormControl(''),
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      email: new FormControl(''),
      cellPhone: new FormControl(''),
      wayOfEntry: new FormControl(''),
      dateOfEntry: new FormControl(''),
      isActive: new FormControl('')
    });
    this.location.subscribe((location) => {
			// ...close popup
			this.activeModal.close();
		});
    this.paginationOpt = {
      currentPage: 1,
      itemsPerPage: 4,
      maxSize: 5,
      directionLinks: true,
      autoHide: true,
      responsive: true,
      previousLabel: 'Anterior',
      nextLabel: 'Siguiente'
    };
  }

  search() {
    const prvListLength = this.clientsList.length;
    this.clientsList = [];
    this.clientsSrv.search(this.createFilterObject()).subscribe(
      (resultData: ServiceResultInterface) => {
        if (resultData.code === 'error') {
          Swal.fire({
            title: 'Error',
            text: 'Error al obtener los datos.\n'.concat(resultData.detail),
            icon: 'error',
            allowOutsideClick: false,
            allowEscapeKey: true,
            showClass: {
              popup: 'animate fadeInUp'
            }
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
              popup: 'animate fadeInUp'
            }
          });
          return;
        }
        this.clientsList = resultData.detail;
        if (this.clientsList.length !== prvListLength) {
          this.paginationOpt.currentPage = 1;
        }
      },
      (error: any) => {
        if (error === 'unauthorized') {
          this.toast.fire({
            icon: 'error',
            html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>'
          });
          return;
        }
        Swal.fire({
          title: 'Error',
          text: 'Error al intentar obtener los datos.\n',
          icon: 'error',
          allowOutsideClick: false,
          allowEscapeKey: true,
          showClass: {
            popup: 'animate fadeInUp'
          }
        });
      }
    );
  }

  pageChange(newPage: number) {
    this.paginationOpt.currentPage = newPage;
  }

  selectClient(client: ClientInterface) {
    this.activeModal.close({
      _id: client._id,
      idNumber: client.idNumber,
      fullName: `${client.companyName}`
    });
  }

  private createFilterObject(): any {
    let filter: any = {};
    if (this.filterForm.controls.idNumber.value) {
      filter.idNumber = this.filterForm.controls.idNumber.value;
    }
    if (this.filterForm.controls.firstName.value) {
      filter.firstName = this.filterForm.controls.firstName.value;
    }
    if (this.filterForm.controls.lastName.value) {
      filter.lastName = this.filterForm.controls.lastName.value;
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
    filter.isActive = true;
    return filter;
  }

  private getClientWayOfEntry() {
    try {
      this.waysOfEntrySrv.search({ isActive: true }).subscribe(
        (response: ServiceResultInterface) => {
          if (response.code !== 'success') {
            this.toast.fire({
              icon: 'error',
              text: `Error al obtener los tamaños.\n ${response.detail}`
            });
            return;
          }
          this.waysOfEntriesCollection = response.detail;
        },
        (error: any) => {
          if (error === 'unauthorized') {
            this.toast.fire({
              icon: 'error',
              html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>'
            });
            return;
          }
          this.toast.fire({
            icon: 'error',
            text: `Error al obtener los tamaños.\n ${error}`
          });
        }
      );
    } catch (ex) {
      this.toast.fire({
        icon: 'error',
        text: `Error al obtener los tamaños.\n ${ex.message}`
      });
    }
  }

  private getData() {
    this.clientsSrv.search({ isActive: true }).subscribe(
      (resultData: any) => {
        Swal.close();
        if (resultData.code === 'success') {
          this.clientsList = resultData.detail;
          return;
        } else {
          if (resultData.code === 'error') {
            Swal.fire({
              title: 'Error',
              text: 'Error al obtener los datos.\n'.concat(resultData.detail),
              icon: 'error',
              allowOutsideClick: false,
              allowEscapeKey: true,
              showClass: {
                popup: 'animate fadeInUp'
              }
            });
          }
        }
      },
      (error: any) => {
        if (error === 'unauthorized') {
          this.toast.fire({
            icon: 'error',
            html: '<h6 class="ml-3 mt-1">La sesión ha finalizado</h6>'
          });
          return;
        }
        Swal.fire({
          title: 'Error',
          text: 'Error al intentar obtener los datos.\n',
          icon: 'error',
          allowOutsideClick: false,
          allowEscapeKey: true,
          showClass: {
            popup: 'animate fadeInUp'
          }
        });
      }
    );
  }
}
