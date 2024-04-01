import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, distinctUntilChanged, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceScreenSizeService {

  public readonly screenWidth$: Observable<ScreenWidthEnum> = this.breakpointObserver.observe([ScreenSizeQuery.Large, ScreenSizeQuery.Medium])
    .pipe(map(state => state.breakpoints[ScreenSizeQuery.Large] ? ScreenWidthEnum.Large : state.breakpoints[ScreenSizeQuery.Medium] ? ScreenWidthEnum.Medium : ScreenWidthEnum.Small))
    .pipe(distinctUntilChanged());
  public readonly isSmall$: Observable<boolean> = this.screenWidth$.pipe(map(width => width === ScreenWidthEnum.Small));
  public readonly isNotSmall$: Observable<boolean> = this.screenWidth$.pipe(map(width => width !== ScreenWidthEnum.Small));
  public readonly isMedium$: Observable<boolean> = this.screenWidth$.pipe(map(width => width === ScreenWidthEnum.Medium));
  public readonly isLarge$: Observable<boolean> = this.screenWidth$.pipe(map(width => width === ScreenWidthEnum.Large));
  public readonly latestScreenWidth$: ReplaySubject<ScreenWidthEnum> = new ReplaySubject<ScreenWidthEnum>(1); // for DX components that just need a latest value
  public readonly latestIsSmall$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1); // for DX components that just need a latest value

  constructor(
    public breakpointObserver: BreakpointObserver
  ) {
    this.screenWidth$.subscribe(this.latestScreenWidth$);
    this.isSmall$.subscribe(this.latestIsSmall$);
  }

  public ngOnDestroy() {
    this.latestScreenWidth$.complete();
    this.latestIsSmall$.complete();
  }

}

// Enum must match media query values in CSS: src/_variables.scss
// small rougly corresponds to phones in profile mode
export enum ScreenWidthEnum { Small, Medium, Large };

const MEDIUM_MIN = 640;
const LARGE_MIN = 1280;
const ScreenSizeQuery = {
  Large: `(${LARGE_MIN}px <= width)`,
  Medium: `(${MEDIUM_MIN}px <= width < ${LARGE_MIN}px)`,
};
