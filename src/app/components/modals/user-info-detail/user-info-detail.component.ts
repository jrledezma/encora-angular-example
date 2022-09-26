import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ServiceResultInterface } from "src/app/interfaces";
import { countryList } from "../../../../constant-values";
import { ConfigValuesService } from "../../../services";

@Component({
	selector: "app-user-info-detail",
	templateUrl: "./user-info-detail.component.html",
	styles: [],
})
export class UserInfoDetailComponent implements OnInit {
	@Input() userInfo: any = {};
	userStatus: any = {};
	countryList = countryList;

	constructor(
		public activeModal: NgbActiveModal,
		private configValuesSrv: ConfigValuesService
	) {}

	ngOnInit() {
		this.configValuesSrv
			.getUserStatus()
			.subscribe((observer: ServiceResultInterface) => {
				if (observer.code === "success") {
					this.userStatus = observer.detail;
				}
			});
		if (this.userInfo.countryCode) {
			this.userInfo.phoneNumber = `${this.getCountryInfo("dial_code")} ${
				this.userInfo.phoneNumber
			}`;
			this.userInfo.countryCode = this.getCountryInfo("name");
		}
	}

	getCountryInfo(requestedValue: string): string {
		const returnValue = this.countryList.filter((country) => {
			if (country.code === this.userInfo.countryCode) {
				return country;
			}
		})[0][requestedValue];
		return returnValue;
	}
}
