import { AbstractControl } from '@angular/forms';

export class PasswordValidator {
    static MatchPassword(control: AbstractControl) {
        const password = control.get('password').value;
        const confirmPassword = control.get('confirmPassword').value;
        if (confirmPassword !== null && confirmPassword !== '' && confirmPassword !== undefined) {
            if (password !== confirmPassword) {
                control.get('confirmPassword').setErrors({ confirmPassword: true });
                return;
            }
        }
        return null;
    }

    static ValidatePasswordStrength(control: AbstractControl) {
        const password = control.get('password').value;
        if (password !== null && password !== '' && password !== undefined) {
            let regex = new RegExp(/^(?=.*[A-Z])(?=.*[!@#$&*+=%])(?=.*[0-9]).{8,}$/);
            if (!regex.test(password)) {
                control.get('password').setErrors({ passwordStrengh: true });
                return;
            }
        }
        return null;
    }
}
