import { AbstractControl } from '@angular/forms';

export class EmailValidator {
    static Validator(control: AbstractControl) {
        if (control.get('email')) {
            const email = control.get('email').value;
            if (email !== null && email !== '' && email !== undefined) {
                const regex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                if (!regex.test(email)) {
                    control.get('email').setErrors({ emailNotValid: true });
                    return;
                }
            }
        }
        return null;
    }
}
