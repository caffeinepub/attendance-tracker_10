import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AttendanceRecord {
    id: bigint;
    status: AttendanceStatus;
    studentName: string;
    date: string;
}
export enum AttendanceStatus {
    present = "present",
    late = "late",
    absent = "absent"
}
export interface backendInterface {
    addRecord(studentName: string, date: string, status: AttendanceStatus): Promise<bigint>;
    deleteRecord(id: bigint): Promise<void>;
    getAllRecords(): Promise<Array<AttendanceRecord>>;
    updateStatus(id: bigint, newStatus: AttendanceStatus): Promise<void>;
}
