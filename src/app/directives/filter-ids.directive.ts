import { AfterViewChecked, AfterViewInit, Directive, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import { maybeResetFilterAndQueryParam } from "./_helpers/filter-ids";
import { FILTER_IDS_PARAM_NAME } from '../_helpers/filter-ids';


@Directive({
    selector: '[cpFilterIds]'
})
// TODO: Remove this?? - replaced with handlers in state storing - or check it works standalone without interfering with state storing
export class FilterIdsDirective implements OnInit, AfterViewInit {
    // Filter Ids on a Data Grid if one or more IDs are passed in the query param named: [cpFilterIds] (default 'filterIds')
    // - eg, can change default: [cpFilterIds]="'filterIdKeyList'"

    @Input() cpFilterIds = FILTER_IDS_PARAM_NAME;
    @Input() storageKey;

    constructor(
        private _router: Router,
        private _route: ActivatedRoute,
        private _grid: DxDataGridComponent, // need to extend to DxTreeListComponent
    ) { }


    public ngOnInit() {
        if (!this.storageKey) { // defer to storage directive/cpCacheGrid for filter and query handling
            maybeResetFilterAndQueryParam(this._router, this._route, this.cpFilterIds, this._grid);
        }
    }

    public ngAfterViewInit() {
    }
}


@Directive({
    selector: '[cpFilterIdsParam]'
})
export class FilterIdsParamDirective {
    // Filter Ids on a Data Grid if one or more IDs are passed in the query param named: [cpFilterIds] (default 'filterIds')
    // - eg, can change default: [cpFilterIds]="'filterIdKeyList'"

    @Input() cpFilterIdsParam = FILTER_IDS_PARAM_NAME;

    constructor(
    ) { }



}
