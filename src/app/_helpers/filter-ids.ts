

export const FILTER_IDS_PARAM_NAME = "filterIds";

type Params = {[key: string]: (string | string[])};

export function filterIdsParam(itemIds: number[], filterIdsParam = FILTER_IDS_PARAM_NAME): { queryParams: { [key: string]: string } } {
    // Convert id list to param (and pass ids as single comma-sep string rather that one k=v pair per item)
    return { queryParams: { [filterIdsParam]: itemIds.join(',') } };
}

export function filterIdList(qp: Params, filterIdsParam: string): number[] {
    // convert filterIds to integer array; source is either (string | string[]) where each string is comma-sep values
    const val = qp[filterIdsParam];
    return val ? ((typeof val === 'string') ? [val] : Array.isArray(val) ? val : []).flatMap((csv) => csv.split(',').map(i => parseInt(i, 10)).filter(i => !isNaN(i))) : [];
}

export function filterValueKeyInList(keyName: string, idList: number[]): [] | [[string, string, number[]]] {
    // return a list with a single filterlist or empty list in no ids
    return idList.length === 0 ? [] : [[keyName, 'anyof', idList]];
}

export function filterValueFromParams(params: Params, cpFilterIds: string, keyName: string): any[] {
    // Convert query param to id list
    const filterIds = filterIdList(params, cpFilterIds);
    if (filterIds.length === 0) {
        return [];
    } else {
        return filterValueKeyInList(keyName, filterIds);
    }
}
