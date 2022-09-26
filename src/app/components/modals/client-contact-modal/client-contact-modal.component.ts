import { Component, OnInit, Input } from '@angular/core';
import { Location } from "@angular/common";
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import * as ConstValues from '../../../../constant-values';

import {
  ServiceResultInterface,
  ClientContactInterface
} from 'src/app/interfaces';
import {
  ClientsService,
  ClientWayOfEntriesService,
  CommonFunctionsService
} from 'src/app/services';
import { response } from 'express';

@Component({
  selector: 'app-client-contact-modal',
  templateUrl: './client-contact-modal.component.html',
  styles: []
})
export class ClientContactModalComponent implements OnInit {
  @Input() clientId: string;
  @Input() data: ClientContactInterface;
  @Input() isNewContact: boolean;
  contactForm: FormGroup;

  private toast = ConstValues.Toast;

  constructor(
    public activeModal: NgbActiveModal,
    private clientSrv: ClientsService,
    private waysOfEntrySrv: ClientWayOfEntriesService,
    private commoFunctionsSrv: CommonFunctionsService,
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
    this.contactForm.reset(this.data);
  }

  save() {
    if (!this.isNewContact) {
      if (!this.data.idNumber) {
        this.createRecord();
      } else {
        this.modifyRecord();
      }
    } else {
      let idNumber = '';
      if (this.data && this.data.idNumber) {
        idNumber = this.data.idNumber;
      } else {
        idNumber = this.commoFunctionsSrv.generateUUID();
      }
      if (this.clientId) {
        this.createRecord();
      } else {
        this.activeModal.close({
          idNumber: idNumber,
          firstName: this.contactForm.controls.firstName.value,
          lastName: this.contactForm.controls.lastName.value,
          email: this.contactForm.controls.email.value,
          cellPhone: this.contactForm.controls.cellPhone.value,
          comments: this.contactForm.controls.comments.value,
          isSavedInDB: false
        });
      }
    }
  }

  private createFormGroup() {
    this.contactForm = new FormGroup({
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.email]),
      cellPhone: new FormControl(''),
      comments: new FormControl('', [
        Validators.minLength(15),
        Validators.maxLength(250)
      ])
    });
    this.createUserObject(true);
    //this.contactForm.setValue(this.clientData);
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
          popup: 'animated fadeInUp'
        }
      }).then(result => {
        if (result.value) {
          Swal.fire({
            title: 'Guardando Datos',
            text: 'Se estan guardando los datos, por favor espere',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showClass: {
              popup: 'animate fadeInUp'
            }
          });
          Swal.showLoading();
          let idNumber = this.data.idNumber
            ? this.data.idNumber
            : this.commoFunctionsSrv.generateUUID();
          this.clientSrv
            .addModifyContact(this.clientId, {
              idNumber,
              firstName: this.contactForm.controls.firstName.value,
              lastName: this.contactForm.controls.lastName.value,
              email: this.contactForm.controls.email.value,
              cellPhone: this.contactForm.controls.cellPhone.value,
              comments: this.contactForm.controls.comments.value
            })
            .subscribe(
              (resultData: any) => {
                if (resultData.code === 'success') {
                  Swal.fire({
                    title: 'Datos Guardados',
                    text:
                      'Los datos fueron guardados correctamente\nDesea crear un nuevo Usuario?',
                    icon: 'success',
                    showCancelButton: true,
                    cancelButtonText: 'Volver',
                    confirmButtonText: 'Crear Nuevo',
                    allowOutsideClick: false,
                    allowEscapeKey: true,
                    showClass: {
                      popup: 'animated tada'
                    }
                  }).then(result => {
                    if (result.value) {
                      this.createUserObject(true);
                      return;
                    }
                    this.activeModal.close(
                      this.activeModal.close({
                        idNumber,
                        firstName: this.contactForm.controls.firstName.value,
                        lastName: this.contactForm.controls.lastName.value,
                        email: this.contactForm.controls.email.value,
                        cellPhone: this.contactForm.controls.cellPhone.value,
                        comments: this.contactForm.controls.comments.value,
                        isSavedInDB: false
                      })
                    );
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
                      popup: 'animate fadeInUp'
                    }
                  });
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
                  text: 'Error al intentar guardar los datos.\n',
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
      });
    } catch (ex) {
      Swal.fire({
        title: 'Error',
        text: JSON.stringify(ex),
        icon: 'error',
        allowOutsideClick: false,
        showClass: {
          popup: 'animate fadeInUp'
        }
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
          popup: 'animated fadeInUp'
        }
      }).then(result => {
        if (result.value) {
          Swal.fire({
            title: 'Modificando Datos',
            text: 'Se estan modificando los datos, por favor espere',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showClass: {
              popup: 'animate fadeInUp'
            }
          });
          Swal.showLoading();
          this.clientSrv
            .addModifyContact(this.clientId, {
              idNumber: this.data.idNumber,
              firstName: this.contactForm.controls.firstName.value,
              lastName: this.contactForm.controls.lastName.value,
              email: this.contactForm.controls.email.value,
              cellPhone: this.contactForm.controls.cellPhone.value,
              comments: this.contactForm.controls.comments.value
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
                      popup: 'animated tada'
                    }
                  }).then(result => {
                    this.activeModal.close({
                      idNumber: this.data.idNumber,
                      firstName: this.contactForm.controls.firstName.value,
                      lastName: this.contactForm.controls.lastName.value,
                      email: this.contactForm.controls.email.value,
                      cellPhone: this.contactForm.controls.cellPhone.value,
                      comments: this.contactForm.controls.comments.value,
                      isSavedInDB: false
                    });
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
                      popup: 'animate fadeInUp'
                    }
                  });
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
                  text: 'Error al intentar modificar los datos.\n',
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
      });
    } catch (ex) {
      Swal.fire({
        title: 'Error',
        text: JSON.stringify(ex),
        icon: 'error',
        allowOutsideClick: false,
        showClass: {
          popup: 'animate fadeInUp'
        }
      });
    }
  }

  private createUserObject(reset: boolean) {
    if (reset) {
      this.contactForm.reset({
        _id: '',
        idNumber: '',
        firstName: '',
        lastName: '',
        email: '',
        cellPhone: '',
        wayOfEntry: '',
        dateOfEntry: '',
        comments: ''
      });
      return;
    }
    this.data = {
      firstName: '',
      lastName: '',
      email: '',
      cellPhone: '',
      comments: ''
    };
  }
}
