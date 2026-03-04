import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

actor {
  type AttendanceStatus = {
    #present;
    #absent;
    #late;
  };

  module AttendanceStatus {
    public func compare(status1 : AttendanceStatus, status2 : AttendanceStatus) : Order.Order {
      switch (status1, status2) {
        case (#present, #absent) { #less };
        case (#present, #late) { #less };
        case (#absent, #late) { #less };
        case (#absent, #present) { #greater };
        case (#late, #present) { #greater };
        case (#late, #absent) { #greater };
        case _ { #equal };
      };
    };
  };

  type AttendanceRecord = {
    id : Nat;
    studentName : Text;
    date : Text; // ISO 8601 date format
    status : AttendanceStatus;
  };

  module AttendanceRecord {
    public func compare(a1 : AttendanceRecord, a2 : AttendanceRecord) : Order.Order {
      Nat.compare(a1.id, a2.id);
    };
  };

  let records = Map.empty<Nat, AttendanceRecord>();
  var nextId = 0;

  public shared ({ caller }) func addRecord(studentName : Text, date : Text, status : AttendanceStatus) : async Nat {
    let record : AttendanceRecord = {
      id = nextId;
      studentName;
      date;
      status;
    };
    records.add(nextId, record);
    nextId += 1;
    record.id;
  };

  public query ({ caller }) func getAllRecords() : async [AttendanceRecord] {
    records.values().toArray().sort();
  };

  public shared ({ caller }) func deleteRecord(id : Nat) : async () {
    switch (records.get(id)) {
      case (null) { Runtime.trap("Record does not exist") };
      case (?_) {
        records.remove(id);
      };
    };
  };

  public shared ({ caller }) func updateStatus(id : Nat, newStatus : AttendanceStatus) : async () {
    switch (records.get(id)) {
      case (null) { Runtime.trap("Record does not exist") };
      case (?existingRecord) {
        let updatedRecord : AttendanceRecord = {
          id = existingRecord.id;
          studentName = existingRecord.studentName;
          date = existingRecord.date;
          status = newStatus;
        };
        records.add(id, updatedRecord);
      };
    };
  };
};
