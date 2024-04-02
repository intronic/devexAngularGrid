import { NgModule, Component, enableProdMode, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import DataSource from 'devextreme/data/data_source';
import { DxBulletModule, DxTemplateModule } from 'devextreme-angular';
import { DxDataGridComponent, DxDataGridModule, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { Service } from './app.service';
import { DeviceScreenSizeService, ScreenWidthEnum } from './device-screen-size.service';
import { Column } from 'devextreme/ui/data_grid';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css', "../vendors/dx/css/devextreme-custom.scss"],
  providers: [Service],
})
export class AppComponent implements OnInit, AfterViewInit {
	@ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  dataSource: DataSource;

  collapsed = false;
  sessionKey = "Test~grid";
  views: ViewName[] = [{ tag: "standard", name: "Standard", visCols: new Set(["SaleDate", "Region", "Sector", "Channel"]) }];

  contentReady = (e: DxDataGridTypes.ContentReadyEvent) => {
    if (!this.collapsed) {
      this.collapsed = true;
      e.component.expandRow(['EnviroCare']);
    }
  };

  customizeTooltip = ({ originalValue }: Record<string, string>) => ({ text: `${parseInt(originalValue)}%` });

  constructor(
    service: Service,
    protected dss: DeviceScreenSizeService,
    ) {
    this.dataSource = service.getDataSource();
    this.customLoad = this.customLoad.bind(this);
    this.customSave = this.customSave.bind(this);
  }

  ngOnInit() {
    // this.
  }

  ngAfterViewInit(): void {
  }

  async customLoad() {
    return customDxGridLoadState(this.sessionKey, [], (x) => {}, this.dss);
  }

  async customSave(dxState: any) {
    return customDxGridSaveState(this.sessionKey, false, () => { return this.views[0] }, this.dss);
  }
}

const nameof = <T>(name: keyof T) => name as string;

type ViewName
    = { tag: "none", name: null }
    // | { tag: "standardName", name: string } // from context menu item for standard view
    // | { tag: "customName", name: string } // name to query API for view json
    | { tag: "standard", name: string, visCols: Set<string> } // view with cols after setup
    | { tag: "custom", name: string, visCols: Set<string> } // view with cols after API call

export type SavedViewState = { __cp_view_tag: "standard" | "custom" | "none", __cp_view_name: string, __cp_view_vis_cols: string[], __cp_view_state: any };


function parseSavedGridTreeState(sessionKey: string): SavedViewState | null { // TODO: MJP - remove devicetype
  try {
      // const state = JSON.parse(sessionStorage.getItem(makeKey(sessionKey, deviceType)));
      const state = JSON.parse(sessionStorage.getItem(sessionKey+"~p") ?? "");
      if (state && Object.hasOwn(state, nameof<SavedViewState>('__cp_view_tag'))) {
          return state;
      } else {
          return null;
      }
  }
  catch (error) {
      console.error(`Error parsing saved state`, error);
      return null;
  }
}


function customDxGridLoadState(sessionKey: string, initialFilterValue: (string | number[])[][], setView: (view: ViewName) => void, screenSizeSvc: DeviceScreenSizeService): () => Promise<any> {
  // close over filterValue, we only want to set this on the first load, not subsequent
  // only load state if the current deviceType matches the initial (& saved) devicetype
  // var filterValue: (string | number[])[][] = initialFilterValue;
  return async function (): Promise<any> {
      const savedState = parseSavedGridTreeState(sessionKey);
      const viewName: ViewName | null = savedViewName(savedState);
      if (savedState && viewName) {
          // if (filterValue.length > 0) {
          //     savedState.__cp_view_state['filterValue'] = filterValue;
          //     savedState.__cp_view_state['filterPanel']['filterEnabled'] = true; // show the filter so user can remove it to see all rows
          //     filterValue = []; // only apply it one time
          // }
          console.debug(`> MJP ${Date.now()} customDxGridLoadState | Load =`, sessionKey, viewName, savedState.__cp_view_vis_cols, 'saved-vis=', getVisibleColumns(savedState.__cp_view_state.columns), savedState);
          setView(viewName);
          return savedState.__cp_view_state;
      } else {
          console.debug(`> MJP ${Date.now()} customDxGridLoadState | Not loaded [${savedState === null ? "No State" : "No Device Type"}] savedState`, sessionKey, savedState);
          return {}
      }
  }
}

function savedViewName(state: SavedViewState | null): ViewName | null {
  if (!state || !state.__cp_view_tag || !state.__cp_view_name || !state.__cp_view_name || !state.__cp_view_vis_cols) {
    console.debug(`> MJP - savedViewName - no view`, state);
    return null;
  }
  const v: ViewName =
      (state.__cp_view_tag === "standard")
          ? { tag: state.__cp_view_tag, name: state.__cp_view_name, visCols: new Set(state.__cp_view_vis_cols) }
          : (state.__cp_view_tag === "custom")
              ? { tag: state.__cp_view_tag, name: state.__cp_view_name, visCols: new Set(state.__cp_view_vis_cols) }
              : { tag: "none", name: null };
  console.debug(`> MJP - savedViewName`, v);
  return v;
}


export function customDxGridSaveState(sessionKey: string, readOnly: boolean, getView: () => ViewName, screenSizeSvc: DeviceScreenSizeService): (dxState: any) => void {
  // save current state (including columns) with the current deviceType (changes based on window size small/not small)
  return async function (dxState): Promise<void> {
      try {
          if (!Object.hasOwn(dxState, 'columns')) {
              throw new Error(`Grid save state missing columns`); // can happen eg when datasource fails to load from API - only a few state keys are available initially
          }
          if (Object.hasOwn(dxState, nameof<SavedViewState>('__cp_view_tag'))) {
              throw new Error(`Grid save state has view tag`);
          }
          const visCols = getVisibleColumns(dxState.columns ?? []);
          const view = getView();
          // const deviceType: DeviceType = phoneOrDesktopFromCols(visCols);
          if (!readOnly) {
              const saveState = removeUnwantedStateProperties(dxState);
              const viewState: SavedViewState = {
                  __cp_view_tag: view.tag,
                  __cp_view_name: view.name ?? "",
                  __cp_view_vis_cols: view.tag === 'none' ? [] : Array.from(view.visCols ?? []), __cp_view_state: saveState };
              console.debug(`> MJP ${Date.now()} customDxGridSaveState | Saved=`, sessionKey, 'vis=', visCols, 'view=', view);
              sessionStorage.setItem(sessionKey, JSON.stringify({ ...viewState, __cp_view_vis_cols: visCols }));
              // sessionStorage.setItem(makeKey(sessionKey, deviceType), JSON.stringify({...viewState, __cp_view_vis_cols: visCols}));
          } else {
              console.debug(`> MJP ${Date.now()} customDxGridSaveState | NOT SAVED=`, sessionKey, 'vis=', dxState.columns.filter((x: Column) => x.visible).map((x: Column) => (x.name ?? x.dataField)), 'view=', view);
          }
      }
      catch (error) {
          console.error(`Register customSave error (${sessionKey})`, error, 'dxState=', dxState);
          throw error;
      }
  }
}



function getVisibleColumns(columns: {visible?: boolean, name?: string, dataField?: string}[]): string[] {
  return columns.filter(x => x.visible).map(x => (x.name ?? x.dataField ?? "")).filter(x => x);
}

function removeUnwantedStateProperties(dxState: any): any {
  const { focusedRowKey: _, ...newState } = dxState;
  return newState;
}
