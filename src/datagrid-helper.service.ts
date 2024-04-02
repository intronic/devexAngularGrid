import { Injectable } from '@angular/core';
import { DxDataGridComponent, DxTreeListComponent } from 'devextreme-angular';
import dxDataGrid, { Column } from 'devextreme/ui/data_grid';
import dxTreeList from 'devextreme/ui/tree_list';
import { Observable, ReplaySubject } from 'rxjs';
import { SavedViewState, ViewName, checkColumnsHaveNameAndType, setColumnVisibility } from './app/_helpers/customViewsHelpers';
import { cloneDeep, isEmpty } from 'lodash-es';

@Injectable({
	providedIn: 'root'
})
export class CpDatagridHelperService {

	constructor(
		// private _auth: AuthenticationService,
	) { }


	public setStandardGridViewState2(grid: DxDataGridComponent, viewName: ViewName, filterValue: any[], resetPaging: boolean) {
		console.debug(`> MJP setGridViewState2 `, viewName);
		// grid.currentStandardView(viewName); // TODO: MJP - add SAVE ViewName: showColumns & view name & standard as __prop
		// grid['__cp_current_viewname'] = viewName; // TODO: MJP - do we need to keep this here? would be better in a CpDataGrid
		this.setGridViewState(grid, viewName.tag === 'standard' ? viewName.visCols : null, filterValue, resetPaging);
	}

	public setGridViewState(grid: DxDataGridComponent, showColumns: Set<string>, filterValue: any[], resetPaging: boolean) {
		console.debug(`> MJP setGridViewState`, showColumns, grid.columns);
		checkColumnsHaveNameAndType(grid.columns);
		grid.instance.beginUpdate(); // TODO: MJP - do we need the begin/end update?
		const cols = grid.columns as { dataField?: string, name?: string, visible?: boolean }[];
		// apply column visibility
		cols.forEach(col => {
				setColumnVisibility(col, showColumns);
		});
		grid.instance.clearGrouping(); //clear groups in case one was applied by user/custom view
		// If we should reset paging (eg, the old & new filtervalue are different or datasources totally different) reset the state related to data values so grid does not try to move to selected rows/pages that are no longer present/visible
		if (resetPaging) {
			grid.focusedRowKey = undefined;
			grid.selectedRowKeys = [];
			grid.selectionFilter = undefined;
			grid.instance.pageIndex(0);
		}
		grid.filterValue = filterValue;
		grid.instance.endUpdate();
	}


	public static setCustomGridViewState(gridInstance: dxDataGrid<any, any> | dxTreeList<any, any>, dxState: any): void {
		const newState = CpDatagridHelperService.sanitiseState(dxState);
		gridInstance.beginUpdate();
		const curState = gridInstance.state();
		if (!Object.hasOwn(newState, 'columns')) {
			throw new Error(`load grid view newState missing columns`);
		}
		if (Object.hasOwn(newState, nameof<SavedViewState>('__cp_view_tag'))) {
			throw new Error(`load grid view newState has view tag`);
		}
		if (Object.hasOwn(curState, nameof<SavedViewState>('__cp_view_tag'))) {
			throw new Error(`load grid view curState has view tag`);
		}

		if (isEmpty(curState)) {
			console.warn(`load grid view curState empty`, curState)
		}
		if (isEmpty(newState)) {
			console.warn(`load grid view newState empty`, newState)
		}
		// TODO: MJP - check if setting state direct works or we need to change the columns differently....
		console.debug(`> MJP CV2svc: _loadGridViewState() -> merge old and new state`, newState);
		gridInstance.state({ ...curState, ...newState }); // overlay new state without changing transient state
		gridInstance.endUpdate();
	}

	public static sanitiseState(dxState: any): any {
		//https://js.devexpress.com/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/stateStoring/
		const { selectedRowKeys, filterPanel, pageIndex, pageSize, allowedPageSizes, ...cleanState } = dxState; // dont load/save transient state properties
		return cleanState;
	}



  // TODO: MJP: Is this even used? deprecate this for setGridViewState (moved here so easy to see its partial duplicated code) (see also cp-treelist-helper.service: changeViews)
  //       USE THIS column option "visible" strategy but on the grid not instance?
  public changeViews(datagrid: DxDataGridComponent, shownColumns: string[] = []): void {
    let gridColumns = datagrid.instance.option("columns") as Column<any, any>[];

    shownColumns.push("headerContextMenu");

    datagrid.instance.beginUpdate();
    gridColumns.forEach(columnHeader => {
      datagrid.instance.columnOption(columnHeader.name, "visible", false);
      if (shownColumns.includes(columnHeader.name)) {
        datagrid.instance.columnOption(columnHeader.name, "visible", true);

        // Control the child column visibility here.
        // columnHeader.columns.forEach(col => {
        // 	this.datagrid.instance.columnOption(col.dataField, "visible", false);
        // });
      }
    });
    datagrid.instance.clearGrouping();
    datagrid.instance.clearFilter();
    datagrid.instance.endUpdate();
  }

}

const nameof = <T>(name: keyof T) => name as string;
