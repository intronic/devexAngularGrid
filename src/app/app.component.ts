import { NgModule, Component, enableProdMode, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import DataSource from 'devextreme/data/data_source';
import { DxBulletModule, DxTemplateModule } from 'devextreme-angular';
import { DxDataGridComponent, DxDataGridModule, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { Service } from './app.service';
import { DeviceScreenSizeService, ScreenWidthEnum } from './device-screen-size.service';
import { Column, InitializedEvent } from 'devextreme/ui/data_grid';
import { event } from 'jquery';
import { ClickEvent } from 'devextreme/ui/button';
import { ItemClickEvent } from 'devextreme/ui/drop_down_button';
import { firstValueFrom } from 'rxjs';
import { SavedViewState, ViewName, getVisCols } from './_helpers/customViewsHelpers';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
  providers: [Service],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  dataSource: DataSource;

  collapsed = false;
  sessionKey = "Test~grid";
  views: ViewName[] = [
    { tag: "standard", name: "Standard", visCols: new Set(["Product", "Region", "Sector", "Channel"]) },
    { tag: "standard", name: "Product", visCols: new Set(["Product", "SaleAmount", "SaleDate", "Region"]) }
  ];

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
    console.debug(`> MJP ${Date.now()} - ctor ds=`, this.dataSource);
    this.customLoad = this.customLoad.bind(this);
    this.customSave = this.customSave.bind(this);
  }

  ngOnInit() {
    console.debug(`> MJP ${Date.now()} ngOnInit`)
  }

  onGridInit = (e: InitializedEvent) => {
    console.debug(`> MJP ${Date.now()} datagrid initialised`, e);
  }

  ngAfterViewInit(): void {
    console.debug(`> MJP ${Date.now()} ngAfterViewInit`)
  }

  clearState = (event: ClickEvent): void => {
    sessionStorage.removeItem(this.sessionKey);
  }

  setStandardViewItem = async (event: { itemData?: ViewName }) => {
    if (event.itemData) {
      console.debug(`> MJP ${Date.now()} set view item`, event.itemData);
      await this.setStandardView(event.itemData);
    }
  }

  setStandardView = async (view: ViewName): Promise<void> => {
    if (view.tag === 'standard') {
      console.debug(`> MJP ${Date.now()} set view`, view.name, view.visCols);
    }
  }

  async customLoad(): Promise<any> {
    console.debug(`> MJP ${Date.now()} - customLoad loading`);
    const res = (await customDxGridLoadState(this.sessionKey, [], (x) => { }, this.dss))();
    console.debug(`> MJP ${Date.now()} - customLoad res=`, res);
    return res;
  }

  async customSave(dxState: any): Promise<void> {
    console.debug(`> MJP ${Date.now()} - customSave saving`, dxState);
    const res = (await customDxGridSaveState(this.sessionKey, false, () => { return this.views[0] }, this.dss))(dxState);
    console.debug(`> MJP ${Date.now()} - customSave res=`, res);
    return res;
  }
}

const nameof = <T>(name: keyof T) => name as string;


function parseSavedGridTreeState(sessionKey: string): SavedViewState | null { // TODO: MJP - remove devicetype
  try {
    // const state = JSON.parse(sessionStorage.getItem(makeKey(sessionKey, deviceType)));
    const state = JSON.parse(sessionStorage.getItem(sessionKey) ?? "{}");
    return state;
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
    try {
      const isSmall = await firstValueFrom(screenSizeSvc.latestIsSmall$.asObservable());
      console.debug(`> MJP ${Date.now()} customDxGridLoadState isSmall`, isSmall, screenSizeSvc);
    }
    catch (e) {
      console.error(`> MJP ${Date.now()} customDxGridLoadState ERROR isSmall`, screenSizeSvc);
    }
    const savedState = parseSavedGridTreeState(sessionKey);
    const viewName: ViewName | null = savedViewName(savedState);
    // console.debug(`> MJP ${Date.now()} customDxGridLoadState isSmall=${isSmall}`, sessionKey, viewName, 'saved-vis=', getVisCols(savedState.__cp_view_state.columns), savedState);
    if (viewName) {
      // if (filterValue.length > 0) {
      //     savedState.__cp_view_state['filterValue'] = filterValue;
      //     savedState.__cp_view_state['filterPanel']['filterEnabled'] = true; // show the filter so user can remove it to see all rows
      //     filterValue = []; // only apply it one time
      // }
      console.debug(`> MJP ${Date.now()} customDxGridLoadState | Load =`, sessionKey, viewName, 'saved-vis=', getVisCols(savedState.__cp_view_state.columns), savedState);
      setView(viewName);
      return savedState.__cp_view_state;
    } else {
      console.debug(`> MJP ${Date.now()} customDxGridLoadState | Nothing to load, savedState=`, sessionKey, savedState);
      return {}
    }
  }
}


function savedViewName(state: SavedViewState | null): ViewName | null {
  if (!state || !state.__cp_view_tag || !state.__cp_view_name || !state.__cp_view_vis_cols) {
    console.debug(`> MJP ${Date.now()} - savedViewName - no view`, state);
    return null;
  }
  const v: ViewName =
    (state.__cp_view_tag === "standard")
      ? { tag: state.__cp_view_tag, name: state.__cp_view_name, visCols: new Set(state.__cp_view_vis_cols) }
      : (state.__cp_view_tag === "custom")
        ? { tag: state.__cp_view_tag, name: state.__cp_view_name, visCols: new Set(state.__cp_view_vis_cols) }
        : { tag: "none", name: null };
  console.debug(`> MJP ${Date.now()} - load/savedViewName`, v);
  return v;
}

export function customDxGridSaveState(sessionKey: string, readOnly: boolean, getView: () => ViewName, screenSizeSvc: DeviceScreenSizeService): (dxState: any) => void {
  // save current state (including columns) with the current deviceType (changes based on window size small/not small)
  return async function (dxState: any): Promise<void> {
    try {
      if (!Object.hasOwn(dxState, 'columns')) {
        throw new Error(`Grid save state missing columns`); // can happen eg when datasource fails to load from API - only a few state keys are available initially
      }
      if (Object.hasOwn(dxState, nameof<SavedViewState>('__cp_view_tag'))) {
        throw new Error(`Grid save state has view tag`);
      }
      const view = getView();
      // const deviceType: DeviceType = phoneOrDesktopFromCols(visCols);
      if (!readOnly) {
        const saveState = removeUnwantedStateProperties(dxState);
        const viewState: SavedViewState = {
          __cp_view_tag: view.tag,
          __cp_view_name: view.name ?? "",
          __cp_view_vis_cols: view.tag === 'none' ? [] : Array.from(view.visCols ?? []), __cp_view_state: saveState
        };
        console.debug(`> MJP ${Date.now()} customDxGridSaveState | Saved=`, sessionKey, 'vis=', getVisCols(dxState.columns ?? []), 'view=', view);
        sessionStorage.setItem(sessionKey, JSON.stringify(viewState));
      } else {
        console.debug(`> MJP ${Date.now()} customDxGridSaveState | NOT SAVED=`, sessionKey, 'vis=', getVisCols(dxState.columns ?? []), 'view=', view);
      }
    }
    catch (error) {
      console.error(`Register customSave error (${sessionKey})`, error, 'dxState=', dxState);
      throw error;
    }
  }
}

function removeUnwantedStateProperties(dxState: any): any {
  const { focusedRowKey: _, ...newState } = dxState;
  return newState;
}
