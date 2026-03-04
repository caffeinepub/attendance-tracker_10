import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type AttendanceRecord, AttendanceStatus } from "../backend.d";
import { useActor } from "./useActor";

const CACHE_KEY = "attendance_records";
const QUERY_KEY = ["attendance-records"];

function saveToLocalStorage(records: AttendanceRecord[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage errors
  }
}

function loadFromLocalStorage(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AttendanceRecord[];
    // Restore bigint ids
    return parsed.map((r) => ({ ...r, id: BigInt(r.id) }));
  } catch {
    return [];
  }
}

export function useGetAllRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!actor) return loadFromLocalStorage();
      try {
        const records = await actor.getAllRecords();
        saveToLocalStorage(records);
        return records;
      } catch {
        return loadFromLocalStorage();
      }
    },
    enabled: !isFetching,
    placeholderData: loadFromLocalStorage,
  });
}

export function useAddRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentName,
      date,
      status,
    }: {
      studentName: string;
      date: string;
      status: AttendanceStatus;
    }) => {
      if (!actor) throw new Error("Backend not ready");
      const id = await actor.addRecord(studentName, date, status);
      return { id, studentName, date, status };
    },
    onSuccess: (newRecord) => {
      queryClient.setQueryData<AttendanceRecord[]>(QUERY_KEY, (old = []) => {
        const updated = [
          ...old,
          {
            id: newRecord.id,
            studentName: newRecord.studentName,
            date: newRecord.date,
            status: newRecord.status,
          },
        ];
        saveToLocalStorage(updated);
        return updated;
      });
      toast.success("Record added successfully");
    },
    onError: () => {
      toast.error("Failed to add record");
    },
  });
}

export function useDeleteRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend not ready");
      await actor.deleteRecord(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AttendanceRecord[]>(QUERY_KEY, (old = []) => {
        const updated = old.filter((r) => r.id !== id);
        saveToLocalStorage(updated);
        return updated;
      });
      toast.success("Record deleted");
    },
    onError: () => {
      toast.error("Failed to delete record");
    },
  });
}

export function useUpdateStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: bigint;
      newStatus: AttendanceStatus;
    }) => {
      if (!actor) throw new Error("Backend not ready");
      await actor.updateStatus(id, newStatus);
      return { id, newStatus };
    },
    onSuccess: ({ id, newStatus }) => {
      queryClient.setQueryData<AttendanceRecord[]>(QUERY_KEY, (old = []) => {
        const updated = old.map((r) =>
          r.id === id ? { ...r, status: newStatus } : r,
        );
        saveToLocalStorage(updated);
        return updated;
      });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });
}

export { AttendanceStatus };
