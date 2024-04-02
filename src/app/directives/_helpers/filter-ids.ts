import { ActivatedRoute, Params, Router, UrlCreationOptions } from '@angular/router';
import { DxDataGridComponent, DxTreeListComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { take } from 'rxjs';
import { filterIdList, filterValueFromParams } from 'src/app/_helpers/filter-ids';


export function maybeResetQueryParam(router: Router, activatedRoute: ActivatedRoute, filterIdsParam: string, grid: DxDataGridComponent | DxTreeListComponent) {
    // Set filterIds from query parameter and apply it as a filter on the grid
    // re-route locally to remove the parameter from browser query string to replicate behaviour of desktop 'show in register'
    activatedRoute.queryParams
        .pipe(take(1))
        .subscribe({
            next: (qp) => {
                filterIdReRoute(router, activatedRoute, qp, filterIdsParam);
            }
        });
}

export function maybeResetFilterAndQueryParam(router: Router, activatedRoute: ActivatedRoute, filterIdsParam: string, grid: DxDataGridComponent | DxTreeListComponent) {
    // Set filterIds from query parameter and apply it as a filter on the grid
    // re-route locally to remove the parameter from browser query string to replicate behaviour of desktop 'show in register'
    activatedRoute.queryParams
        .pipe(take(1))
        .subscribe({
            next: (qp) => {
                if (!(grid.dataSource instanceof DataSource)) {
                    throw new Error(`Grid must have DataSource`); // dev time error
                }
                const keyName = grid.dataSource.key();
                if (typeof keyName !== 'string') {
                    throw new Error(`Grid DataSource must have single (non-composite) key`); // dev time error
                }
                setGridFilterValue(qp, filterIdsParam, keyName, grid);
                filterIdReRoute(router, activatedRoute, qp, filterIdsParam);
            }
        });
}

function setGridFilterValue(params: Params, cpFilterIds: string, keyName: string, grid: DxDataGridComponent | DxTreeListComponent): void {
    const filterValue = filterValueFromParams(params, cpFilterIds, keyName);
    if (filterValue.length > 0) {
        grid.filterValue = filterValue;
    }
}

export function filterIdReRoute(router: Router, activatedRoute: ActivatedRoute, params: Params, filterIdsParam: string) {
    const filterIds = filterIdList(params, filterIdsParam);
    if (filterIds.length > 0) {
        router.navigate([], {
            relativeTo: activatedRoute,
            queryParams: { ...params, [filterIdsParam]: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }
}
