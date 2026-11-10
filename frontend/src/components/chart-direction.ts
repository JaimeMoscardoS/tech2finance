export type Direction = 'rise' | 'fall' | 'flat';
/** Direction of a displayed series between successive observations. */
export function directions(values: readonly number[]): Direction[] {
 return values.slice(1).map((value, index) => value > values[index] ? 'rise' : value < values[index] ? 'fall' : 'flat');
}
