import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, distinctUntilChanged, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceScreenSizeService {

  public readonly screenWidth$;
  public readonly isSmall$: Observable<boolean>;
  public readonly isNotSmall$: Observable<boolean>;
  public readonly isMedium$: Observable<boolean>;
  public readonly isLarge$: Observable<boolean>;
  public readonly latestScreenWidth$: ReplaySubject<ScreenWidthEnum> = new ReplaySubject<ScreenWidthEnum>(1); // for DX components that just need a latest value
  public readonly latestIsSmall$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1); // for DX components that just need a latest value

  constructor(
    public breakpointObserver: BreakpointObserver
  ) {
    this.screenWidth$ = this.breakpointObserver.observe([ScreenSizeQuery.Large, ScreenSizeQuery.Medium])
      .pipe(map(state => state.breakpoints[ScreenSizeQuery.Large] ? ScreenWidthEnum.Large : state.breakpoints[ScreenSizeQuery.Medium] ? ScreenWidthEnum.Medium : ScreenWidthEnum.Small))
      .pipe(distinctUntilChanged());
    this.isSmall$ = this.screenWidth$.pipe(map(width => width === ScreenWidthEnum.Small));
    this.isNotSmall$ = this.screenWidth$.pipe(map(width => width !== ScreenWidthEnum.Small));
    this.isMedium$ = this.screenWidth$.pipe(map(width => width === ScreenWidthEnum.Medium));
    this.isLarge$ = this.screenWidth$.pipe(map(width => width === ScreenWidthEnum.Large));
    this.latestScreenWidth$ = new ReplaySubject<ScreenWidthEnum>(1); // for DX components that just need a latest value
    this.latestIsSmall$ = new ReplaySubject<boolean>(1); // for DX components that just need a latest value
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
