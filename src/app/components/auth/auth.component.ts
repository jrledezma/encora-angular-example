import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthService, SessionCacheService } from 'src/app/services';
import Swal from 'sweetalert2';
import { ServiceResultInterface } from 'src/app/interfaces';
import { environment } from '../../../environments/environment';
import swal from 'sweetalert2';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styles: []
})
export class AuthComponent implements OnInit {
  forgotPassword = false;
  signUpData: {
    email: string;
    password: string;
  };
  signInForm: FormGroup;
  passwordRecoveyForm: FormGroup;

  constructor(
    private router: Router,
    public authSrv: AuthService,
    private sessionCacheSrv: SessionCacheService
  ) { }

  ngOnInit() {
    this.createFormsGroup();
  }

  logIn() {
    try {
      Swal.fire({
        title: 'Ingresando',
        text: 'Por favor espere mientras obtenemos su espacio de trabajo',
        icon: 'info',
        allowEscapeKey: false,
        allowOutsideClick: false,
        showClass: {
          popup: 'animated fadeInUp'
        },
        hideClass: {
          popup: 'animated fadeOutUp'
        }
      });
      Swal.showLoading();
      this.authSrv
        .login(
          this.signInForm.controls.email.value,
          this.signInForm.controls.password.value
        )
        .subscribe(
          (observer: ServiceResultInterface) => {
            if (observer.code !== 'success') {
              if (observer.code === 'credentialsError') {
                Swal.fire({
                  title: 'Datos Incorrectos',
                  text: 'Los datos del usuario ingresado no son correctos',
                  icon: 'error',
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                  showClass: {
                    popup: 'animated fadeInUp'
                  },
                  hideClass: {
                    popup: 'animated fadeOutUp'
                  }
                });
                return;
              }
              Swal.fire({
                title: 'Error',
                text: 'Sucedió un error a la hora de validar sus datos',
                icon: 'error',
                allowEscapeKey: false,
                allowOutsideClick: false,
                showClass: {
                  popup: 'animated fadeInUp'
                },
                hideClass: {
                  popup: 'animated fadeOutUp'
                }
              });
              return;
            }
            localStorage.setItem(environment.session_token, observer.detail);
            this.authSrv.getSessionData().subscribe(
              (observer: any) => {
                Swal.close();
                this.sessionCacheSrv.setSessionData({
                  showMenuOptions: true,
                  userFullName: (observer.detail as any).fullName,
                  userImage: (observer.detail as any).image,
                  invitationsQtt: (observer.detail as any).invitationsQtt
                });
              },
              (error: any) => {
                Swal.fire({
                  title: 'Error',
                  text: 'Error al intentar obtener los datos de la sesión.\n',
                  icon: 'error',
                  allowOutsideClick: false,
                  allowEscapeKey: true,
                  showClass: {
                    popup: 'animate fadeInUp'
                  }
                });
              }
            );
            this.router.navigate(['/']);
          },
          (error: any) => {
            if (error.error.code === 'credentialsError') {
              Swal.fire({
                title: 'Datos Incorrectos',
                text: 'Los datos del usuario ingresado no son correctos',
                icon: 'error',
                allowEscapeKey: false,
                allowOutsideClick: false,
                showClass: {
                  popup: 'animated fadeInUp'
                },
                hideClass: {
                  popup: 'animated fadeOutUp'
                }
              });
              return;
            }
            Swal.fire({
              title: 'Error',
              text: 'Sucedió un error a la hora de validar sus datos...',
              icon: 'error',
              allowEscapeKey: false,
              allowOutsideClick: false,
              showClass: {
                popup: 'animated fadeInUp'
              },
              hideClass: {
                popup: 'animated fadeOutUp'
              }
            });
          }
        );
    } catch (ex) {
      Swal.fire({
        title: 'Error',
        text: 'Sucedió un error a la hora de validar sus datos',
        icon: 'error',
        allowEscapeKey: false,
        allowOutsideClick: false,
        showClass: {
          popup: 'animated fadeInUp'
        },
        hideClass: {
          popup: 'animated fadeOutUp'
        }
      });
    }
  }

  recoverPassword() {
    try {
      Swal.fire({
        title: 'Contactando al Servidor',
        text:
          'Por favor, espere mientras realizamos las acciones necesarisas para recuperar su contraseña',
        icon: 'info',
        allowEscapeKey: false,
        allowOutsideClick: false,
        showClass: {
          popup: 'animated fadeInUp'
        },
        hideClass: {
          popup: 'animated fadeOutUp'
        }
      });
      Swal.showLoading();
      this.authSrv
        .forgotPasswordRequest(this.passwordRecoveyForm.controls.email.value)
        .subscribe(
          (observer: ServiceResultInterface) => {
            swal.close();
            if (observer.code !== 'success') {
              if (observer.code === 'emailNotFound') {
                Swal.fire({
                  title: 'Datos Incorrectos',
                  text: 'El correo eléctronico no fue encontrado',
                  icon: 'error',
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                  showClass: {
                    popup: 'animated fadeInUp'
                  },
                  hideClass: {
                    popup: 'animated fadeOutUp'
                  }
                });
                return;
              }
              Swal.fire({
                title: 'Error',
                text: 'Sucedió un error a la hora de validar el correo electronico',
                icon: 'error',
                allowEscapeKey: false,
                allowOutsideClick: false,
                showClass: {
                  popup: 'animated fadeInUp'
                },
                hideClass: {
                  popup: 'animated fadeOutUp'
                }
              });
              return;
            }
            Swal.fire({
              title: 'Solicitud Realizada',
              text:
                'Se ha enviado un correo eléctronico con la información necesaria para recuperar la contraseña',
              icon: 'info',
              allowEscapeKey: false,
              allowOutsideClick: false,
              showClass: {
                popup: 'animated fadeInUp'
              },
              hideClass: {
                popup: 'animated fadeOutUp'
              }
            });
            this.router.navigate(['/']);
          },
          (error: any) => {
            swal.close();
            if (
              error.error.code === 'notDataFound' ||
              error.error.code === 'emailNotFound'
            ) {
              Swal.fire({
                title: 'Datos Incorrectos',
                text: 'El correo eléctronico no fue encontrado',
                icon: 'error',
                allowEscapeKey: false,
                allowOutsideClick: false,
                showClass: {
                  popup: 'animated fadeInUp'
                },
                hideClass: {
                  popup: 'animated fadeOutUp'
                }
              });
              return;
            }
            Swal.fire({
              title: 'Error',
              text: 'Sucedió un error a la hora de validar el correo eléctronico.',
              icon: 'error',
              allowEscapeKey: false,
              allowOutsideClick: false,
              showClass: {
                popup: 'animated fadeInUp'
              },
              hideClass: {
                popup: 'animated fadeOutUp'
              }
            });
          }
        );
    } catch (ex) {
      swal.close();
      Swal.fire({
        title: 'Error',
        text: 'Sucedió un error a la hora de validar el correo eléctronico',
        icon: 'error',
        allowEscapeKey: false,
        allowOutsideClick: false,
        showClass: {
          popup: 'animated fadeInUp'
        },
        hideClass: {
          popup: 'animated fadeOutUp'
        }
      });
    }
  }

  setForgotPassword() {
    this.forgotPassword = !this.forgotPassword;
  }

  private createFormsGroup() {
    this.signInForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
    this.passwordRecoveyForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });

    this.signInForm.setValue({ email: '', password: '' });
  }
}
