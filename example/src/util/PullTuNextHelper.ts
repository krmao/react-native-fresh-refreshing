import { RefObject } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

export class PageItem {
  public name: string;
  public nestedScrollViewRef: RefObject<ScrollView>;
  public translationY: SharedValue<number>;
  public height: number;

  constructor(
    name: string,
    nestedScrollViewRef: RefObject<ScrollView>,
    translationY: SharedValue<number>,
    height: number
  ) {
    this.name = name;
    this.nestedScrollViewRef = nestedScrollViewRef;
    this.translationY = translationY;
    this.height = height;
  }
}

// noinspection JSUnusedGlobalSymbols
export default class PullTuNextHelper {
  private readonly pageItemArray: Array<PageItem>;

  constructor(pageItemArray: Array<PageItem>) {
    this.pageItemArray = pageItemArray;
  }

  public getPrePageItem = (): PageItem => this.pageItemArray[0] as PageItem;
  public getCurPageItem = (): PageItem => this.pageItemArray[1] as PageItem;
  public getNextPageItem = (): PageItem => this.pageItemArray[2] as PageItem;
  public moveToPreItem = (callback?: () => void) => {
    let lastPageItem = this.pageItemArray.pop() as PageItem;
    this.pageItemArray.unshift(lastPageItem);
    callback?.();
  };
  public moveToNextItem = (callback?: () => void) => {
    let prePageItem = this.pageItemArray.shift() as PageItem;
    this.pageItemArray.push(prePageItem);
    callback?.();
  };
}
