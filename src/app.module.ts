import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { ErrorHandler, NgModule, APP_INITIALIZER } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule, provideProtractorTestingSupport } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";


import {

	DxTemplateModule,
	DxTemplateHost,
	DxFormModule,
  DxDataGridModule,
  DxBulletModule,
} from "devextreme-angular";


import 'zone.js/plugins/task-tracking';
import { AppComponent } from "./app/app.component";


@NgModule({
	declarations: [
		AppComponent,
	],
	imports: [
    DxDataGridModule,
    DxTemplateModule,
    DxBulletModule,
		DxFormModule,
		BrowserModule.withServerTransition({ appId: "ng-cli-universal" }),
		HttpClientModule,
		FormsModule,
		// AppRoutingModule,
		ReactiveFormsModule,
		// FooterModule,
		BrowserAnimationsModule,
		// ButtonModule,
		// DevexFastModule,
	],

	providers: [
		DxTemplateHost,
		...provideProtractorTestingSupport()
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
