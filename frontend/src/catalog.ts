import data from "../../shared/demo-data.json" with { type: "json" };
import type { BankProfile } from '../../shared/bank-profile';
export type { BankProfile, BankProduct } from '../../shared/bank-profile';
export const bankProfile = data.bankProfile as BankProfile;
export type AssetType = "fund" | "etf" | "stock";
export type Instrument = { instrumentId:string; assetType:AssetType; assetClass:"mixed"|"equity"|"fixed"|"unknown"; bankId:string; manager:string; relationship:"own"|"third_party"|"fictional"|"unknown"; identifier:string|null; shareClass:string|null; currency:"EUR"|null; sourceUrl:string|null; sourceDate:string|null; dataStatus:"fictional"|"missing_history"|"annual_history"|"historical_nav"|"unsupported_distributions"; name:{es:string;en:string}; officialName?:{es:string;en:string}; returns?:readonly number[] };
export type Bank = { id:string; name:{es:string;en:string} };
export const banks: Bank[] = data.banks;
export const instruments: Instrument[] = data.instruments as Instrument[];
