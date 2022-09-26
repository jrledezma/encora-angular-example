import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
	selector: "app-image-modal",
	templateUrl: "./image-modal.component.html",
	styleUrls: ["./image-modal.component.css"],
})
export class ImageModalComponent implements OnInit {

  @Input() imageUrl: string;
  
	constructor(public activeModal: NgbActiveModal) {}

	ngOnInit() {}
}
