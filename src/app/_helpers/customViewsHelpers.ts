
export type DeviceType = 'phone' | 'desktop';

export type ViewName
    = { tag: "none", name: null }
    // | { tag: "standardName", name: string } // from context menu item for standard view
    // | { tag: "customName", name: string } // name to query API for view json
    | { tag: "standard", name: string, visCols: Set<string> } // view with cols after setup
    | { tag: "custom", name: string, visCols: Set<string> } // view with cols after API call

export type CustomViewCommand
    = { tag: "add", name: string, completed?: (val: any) => void, error?: (err: Error) => void }
    | { tag: "update", name: string, completed?: (val: any) => void, error?: (err: Error) => void }
    | { tag: "delete", name: string, completed?: (val: any) => void, error?: (err: Error) => void }
    | { tag: "copy", from: string, to: string, completed?: (val: any) => void, error?: (err: Error) => void }
    | { tag: "rename", from: string, to: string, completed?: (val: any) => void, error?: (err: Error) => void }


export type StandardView = { text: () => string, onClick: () => void }; // StandardView name and page-specific handler. onClick property name is used to be compatible with ContextMenuItem
export type StandardView2 = StandardView & { visCols: Set<string> };

// TODO: saved standard & custom views should not apply to 'mobile', or should have device type as part of the definition (see eg checklist-edit;
// mobile has different state & columns than desktop, reloading the wrong state will mess it up
export type SavedViewState = { __cp_view_tag: "standard" | "custom" | "none", __cp_view_name: string, __cp_view_vis_cols: string[], __cp_view_state: any };


// Return the view name that should be loaded by default for desktop, plus whether this is mobile, see comments in class: CustomViewsGridTreeBase
// TODO: MJP DELETE
// export function getDefaultViewNameFromViewsAndSize(isSmall: boolean, standardViews: string[], customViewNames: string[]): ViewName {
//     const viewNameDefault = customViewNames.find(x => x.toLowerCase().trim() === 'default');
//     if (viewNameDefault) {
//         const v: ViewName = { tag: "custom", name: viewNameDefault, visCols: null };
//         console.log(`> MJP getDefaultViewNameFromViews -> custom=${viewNameDefault}`, v);
//         return v;
//     }
//     // The default standard view is the first one (usually called 'Standard')
//     if (standardViews.length > 0) {
//         const v: ViewName = { tag: "standard", name: standardViews[0], visCols: null };
//         console.log(`> MJP getDefaultViewNameFromViews ->  std=[${standardViews[0]}]`, v);
//         return v;
//     }
//     const v: ViewName = { tag: "none", name: null };
//     console.log(`> MJP getDefaultViewNameFromViews -> fallback/None -> `, v);
//     return v;
// }


// Return the view name that should be loaded by default in desktop, see comments in class: CustomViewsGridTreeBase
export function getDefaultViewNameFromViews(standardViews: StandardView2[], customViewNames: string[]): ViewName {
    const viewNameDefault = customViewNames.find(x => x.toLowerCase().trim() === 'default');
    const v: ViewName = viewNameDefault
        ? { tag: "custom", name: viewNameDefault, visCols: null }
        : (standardViews.length > 0)  // default 'standard' view is the first on the list regardless of name
            ? { tag: "standard", name: standardViews[0].text(), visCols: standardViews[0].visCols }
            : { tag: "none", name: null };
    console.debug(`> MJP getDefaultViewNameFromViews`, v);
    return v;
}

// set column visible if dataField or name is present in showColumns set. If both keys present, look at name in preference to dataField so multiple columns can be based of 1 dataField
// export function getColumnVisibility(showColumns: Set<string>, allColumns: { dataField?: string, name?: string }[]): { dataField?: string, name?: string, visible: boolean }[] {
//     console.debug(`> MJP - getColumnVisibility - get rid of this??`); // TODO: MJP - get rid of this??
//     const visCols = allColumns.map(col => ({
//         ...col,
//         visible: Boolean(col.name) ? showColumns.has(col.name) : Boolean(col.dataField) && showColumns.has(col.dataField)
//     }));
//     return visCols;
// }

export function setColumnVisibility(col: { dataField?: string, name?: string, visible?: boolean }, showColumns: Set<string>): void {
    col.visible = showColumns.has(col.name ?? col.dataField);
    // console.debug(`> MJP - setColumnVisibility ${(col.name ?? col.dataField)}`, col.visible);
}

export function getVisCols(cols: { dataField?: string, name?: string, visible?: boolean }[]): string[] {
    return cols.filter(col => col.visible).map(col => col.name ?? col.dataField ?? "").filter(col => col);
}

export function checkColumnsHaveNameAndType(columns: any[]) {
    // To calculate visibility when changing views, we expect all columns to have one of datafield or name, plus dataType
    const isString = columns.filter(col => typeof col === 'string');
    if (isString.length > 0) console.error(`Grid Columns are string, expected object:`, isString);
    const noDataType = columns.filter(col => !col.dataType);
    if (noDataType.length > 0) console.error(`Grid Columns missing datatype:`, noDataType);
    const noName = columns.filter(col => !(Boolean(col.dataField) || Boolean(col.name)));
    if (noName.length > 0) console.error(`Grid Columns missing dataField or name:`, noName);
    const bothName = columns.filter(col => !(Boolean(col.dataField) && Boolean(col.name)));
    if (noName.length > 0) console.error(`Grid Columns have both dataField and name:`, bothName);
}
