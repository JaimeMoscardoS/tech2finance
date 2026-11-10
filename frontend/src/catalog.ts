import data from "../../shared/demo-data.json" with { type: "json" };
export type AssetType = "fund" | "etf" | "stock";
export type Instrument = { instrumentId:string; assetType:AssetType; assetClass:"mixed"|"equity"|"fixed"|"unknown"; bankId:string; manager:string; relationship:"own"|"third_party"|"fictional"|"unknown"; identifier:string|null; shareClass:string|null; currency:"EUR"|null; sourceUrl:string|null; sourceDate:string|null; dataStatus:"fictional"|"missing_history"|"annual_history"; name:{es:string;en:string}; returns?:readonly number[] };
export type Bank = { id:string; name:{es:string;en:string} };
export const banks: Bank[] = data.banks;
export const instruments: Instrument[] = data.instruments as Instrument[];
