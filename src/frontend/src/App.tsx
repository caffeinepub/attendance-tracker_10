import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { AttendanceRecord } from "./backend.d";
import {
  AttendanceStatus,
  useAddRecord,
  useDeleteRecord,
  useGetAllRecords,
  useUpdateStatus,
} from "./hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.present]: "Present",
  [AttendanceStatus.absent]: "Absent",
  [AttendanceStatus.late]: "Late",
};

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const cls =
    status === AttendanceStatus.present
      ? "status-present"
      : status === AttendanceStatus.absent
        ? "status-absent"
        : "status-late";

  const icon =
    status === AttendanceStatus.present ? (
      <CheckCircle2 className="h-3 w-3" />
    ) : status === AttendanceStatus.absent ? (
      <XCircle className="h-3 w-3" />
    ) : (
      <Clock className="h-3 w-3" />
    );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-600 font-semibold ${cls}`}
    >
      {icon}
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  iconColor: string;
  ocid: string;
}

function SummaryCard({
  label,
  value,
  icon,
  colorClass,
  iconColor,
  ocid,
}: SummaryCardProps) {
  return (
    <motion.div
      data-ocid={ocid}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-shadow-sm rounded-2xl border p-5 ${colorClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-foreground/60">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${iconColor}`}>{icon}</div>
      </div>
    </motion.div>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  record: AttendanceRecord | null;
  open: boolean;
  onClose: () => void;
}

function EditDialog({ record, open, onClose }: EditDialogProps) {
  const [status, setStatus] = useState<AttendanceStatus>(
    record?.status ?? AttendanceStatus.present,
  );
  const updateStatus = useUpdateStatus();

  const handleSave = async () => {
    if (!record) return;
    await updateStatus.mutateAsync({ id: record.id, newStatus: status });
    onClose();
  };

  // Reset status when record changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
    else if (record) setStatus(record.status);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="edit.dialog"
        className="sm:max-w-sm rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Edit Attendance
          </DialogTitle>
        </DialogHeader>
        {record && (
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {record.studentName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(record.date)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as AttendanceStatus)}
              >
                <SelectTrigger
                  id="edit-status"
                  data-ocid="edit.status.select"
                  className="rounded-xl"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AttendanceStatus.present}>
                    Present
                  </SelectItem>
                  <SelectItem value={AttendanceStatus.absent}>
                    Absent
                  </SelectItem>
                  <SelectItem value={AttendanceStatus.late}>Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            data-ocid="edit.cancel_button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            data-ocid="edit.save.button"
            onClick={handleSave}
            disabled={updateStatus.isPending}
            className="rounded-xl"
          >
            {updateStatus.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Record Form ──────────────────────────────────────────────────────────

function AddRecordForm() {
  const [studentName, setStudentName] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>(
    AttendanceStatus.present,
  );
  const [date, setDate] = useState(todayISO());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addRecord = useAddRecord();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!studentName.trim()) e.studentName = "Student name is required";
    if (!date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await addRecord.mutateAsync({
      studentName: studentName.trim(),
      date,
      status,
    });
    setStudentName("");
    setStatus(AttendanceStatus.present);
    setDate(todayISO());
    setErrors({});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card-shadow rounded-2xl border bg-card p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold">Add Attendance Record</h2>
          <p className="text-xs text-muted-foreground">
            Fill in all fields to add a new record
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Student Name */}
          <div className="space-y-1.5">
            <Label htmlFor="student-name" className="text-sm font-medium">
              Student Name
            </Label>
            <Input
              id="student-name"
              data-ocid="form.student_name.input"
              placeholder="e.g. Alice Johnson"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="rounded-xl"
              aria-invalid={!!errors.studentName}
              aria-describedby={
                errors.studentName ? "student-name-error" : undefined
              }
            />
            {errors.studentName && (
              <p
                id="student-name-error"
                className="text-xs text-destructive"
                data-ocid="form.error_state"
              >
                {errors.studentName}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as AttendanceStatus)}
            >
              <SelectTrigger
                id="status"
                data-ocid="form.status.select"
                className="rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AttendanceStatus.present}>
                  Present
                </SelectItem>
                <SelectItem value={AttendanceStatus.absent}>Absent</SelectItem>
                <SelectItem value={AttendanceStatus.late}>Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="record-date" className="text-sm font-medium">
              Date
            </Label>
            <Input
              id="record-date"
              data-ocid="form.date.input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
              aria-invalid={!!errors.date}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button
            data-ocid="form.add_record.submit_button"
            type="submit"
            disabled={addRecord.isPending}
            className="rounded-xl px-6 font-semibold"
          >
            {addRecord.isPending ? (
              <>
                <Loader2
                  data-ocid="form.loading_state"
                  className="mr-2 h-4 w-4 animate-spin"
                />
                Adding…
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </>
            )}
          </Button>
          {addRecord.isSuccess && !addRecord.isPending && (
            <motion.p
              key="success"
              data-ocid="form.success_state"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-medium text-emerald-600"
            >
              ✓ Record added
            </motion.p>
          )}
        </div>
      </form>
    </motion.div>
  );
}

// ─── Attendance Table ─────────────────────────────────────────────────────────

interface AttendanceTableProps {
  records: AttendanceRecord[];
  isLoading: boolean;
  searchTerm: string;
}

function AttendanceTable({
  records,
  isLoading,
  searchTerm,
}: AttendanceTableProps) {
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const deleteRecord = useDeleteRecord();

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return records;
    return records.filter((r) =>
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [records, searchTerm]);

  const openEdit = (record: AttendanceRecord) => {
    setEditRecord(record);
    setEditOpen(true);
  };

  return (
    <>
      <motion.div
        data-ocid="table.section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-shadow rounded-2xl border bg-card overflow-hidden"
      >
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold">Attendance Records</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}{" "}
                {searchTerm ? "matching" : "total"}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div data-ocid="table.loading_state" className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-[180px] rounded-lg" />
                <Skeleton className="h-4 w-[100px] rounded-lg" />
                <Skeleton className="h-6 w-[80px] rounded-full" />
                <Skeleton className="h-8 w-[80px] rounded-lg ml-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="table.empty_state"
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
          >
            <div className="mb-4 rounded-2xl bg-muted/60 p-5">
              <GraduationCap className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-base font-semibold text-foreground/70">
              {searchTerm ? "No matching records" : "No attendance records yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm
                ? `No records found for "${searchTerm}"`
                : "Add a record using the form above to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-foreground/70 pl-6">
                    Student Name
                  </TableHead>
                  <TableHead className="font-semibold text-foreground/70">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-foreground/70">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-foreground/70 pr-6 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {filtered.map((record, index) => (
                    <motion.tr
                      key={record.id.toString()}
                      data-ocid={`table.row.${index + 1}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.18 }}
                      className="table-row-hover border-b last:border-0"
                    >
                      <TableCell className="font-medium pl-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {record.studentName.charAt(0).toUpperCase()}
                          </div>
                          <span>{record.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm py-3.5">
                        {formatDate(record.date)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <StatusBadge status={record.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            data-ocid={`table.edit_button.${index + 1}`}
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(record)}
                            className="rounded-lg h-8 px-3 text-xs font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
                          >
                            <Pencil className="h-3 w-3 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            data-ocid={`table.delete_button.${index + 1}`}
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecord.mutate(record.id)}
                            disabled={deleteRecord.isPending}
                            className="rounded-lg h-8 px-3 text-xs font-medium hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      <EditDialog
        record={editRecord}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: records = [], isLoading } = useGetAllRecords();

  const summary = useMemo(() => {
    const uniqueNames = new Set(records.map((r) => r.studentName));
    const present = records.filter(
      (r) => r.status === AttendanceStatus.present,
    ).length;
    const absent = records.filter(
      (r) => r.status === AttendanceStatus.absent,
    ).length;
    const late = records.filter(
      (r) => r.status === AttendanceStatus.late,
    ).length;
    return {
      total: uniqueNames.size,
      present,
      absent,
      late,
    };
  }, [records]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />

      {/* ── Header ── */}
      <header data-ocid="header.section" className="gradient-header text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Attendance Tracker
                </h1>
                <p className="mt-0.5 text-sm text-white/75">
                  Track and manage student attendance easily
                </p>
              </div>
            </div>
            <div className="mt-3 sm:mt-0">
              <Badge
                variant="secondary"
                className="bg-white/15 text-white hover:bg-white/20 border-white/20 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm"
              >
                {records.length} Record{records.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="Total Students"
            value={summary.total}
            icon={
              <Users
                className="h-5 w-5"
                style={{ color: "oklch(0.55 0.18 245)" }}
              />
            }
            colorClass="summary-card-blue"
            iconColor="bg-blue-100/80"
            ocid="summary.total_students.card"
          />
          <SummaryCard
            label="Present"
            value={summary.present}
            icon={
              <CheckCircle2
                className="h-5 w-5"
                style={{ color: "oklch(0.55 0.19 148)" }}
              />
            }
            colorClass="summary-card-green"
            iconColor="bg-green-100/80"
            ocid="summary.total_present.card"
          />
          <SummaryCard
            label="Absent"
            value={summary.absent}
            icon={
              <XCircle
                className="h-5 w-5"
                style={{ color: "oklch(0.62 0.22 30)" }}
              />
            }
            colorClass="summary-card-red"
            iconColor="bg-red-100/80"
            ocid="summary.total_absent.card"
          />
          <SummaryCard
            label="Late"
            value={summary.late}
            icon={
              <Clock
                className="h-5 w-5"
                style={{ color: "oklch(0.68 0.18 65)" }}
              />
            }
            colorClass="summary-card-amber"
            iconColor="bg-amber-100/80"
            ocid="summary.total_late.card"
          />
        </div>

        {/* Add Record Form */}
        <AddRecordForm />

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-ocid="search.input"
            placeholder="Search by student name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl pl-10 bg-card card-shadow-sm"
          />
        </motion.div>

        {/* Attendance Table */}
        <AttendanceTable
          records={records}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 border-t py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
