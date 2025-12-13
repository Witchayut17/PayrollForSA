import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Save, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface AttendanceRecord {
  user_id: string;
  full_name: string;
  employee_id: string;
  status: string;
  check_in: string;
  check_out: string;
}

export function AttendanceFormView() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["all-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, employee_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: existingAttendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["attendance", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("attendance_date", selectedDate);
      if (error) throw error;
      return data;
    },
  });

  // Initialize attendance data when employees or existing attendance changes
  useState(() => {
    const initial: Record<string, AttendanceRecord> = {};
    employees.forEach((emp) => {
      const existing = existingAttendance.find((a) => a.user_id === emp.id);
      initial[emp.id] = {
        user_id: emp.id,
        full_name: emp.full_name || "",
        employee_id: emp.employee_id || "",
        status: existing?.status || "present",
        check_in: existing?.check_in || "09:00",
        check_out: existing?.check_out || "18:00",
      };
    });
    setAttendanceData(initial);
  });

  const updateAttendance = (userId: string, field: keyof AttendanceRecord, value: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const saveAttendance = useMutation({
    mutationFn: async () => {
      const records = Object.values(attendanceData).map((record) => ({
        user_id: record.user_id,
        attendance_date: selectedDate,
        status: record.status,
        check_in: record.check_in || null,
        check_out: record.check_out || null,
        recorded_by: user?.id,
      }));

      // Upsert attendance records
      const { error } = await supabase.from("attendance").upsert(records, {
        onConflict: "user_id,attendance_date",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save attendance: " + error.message);
    },
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Merge existing data with employees
  const displayData = filteredEmployees.map((emp) => {
    const existing = existingAttendance.find((a) => a.user_id === emp.id);
    return {
      ...emp,
      status: attendanceData[emp.id]?.status || existing?.status || "present",
      check_in: attendanceData[emp.id]?.check_in || existing?.check_in || "09:00",
      check_out: attendanceData[emp.id]?.check_out || existing?.check_out || "18:00",
    };
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Attendance Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2 flex items-end">
              <Button onClick={() => saveAttendance.mutate()} disabled={saveAttendance.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveAttendance.isPending ? "Saving..." : "Save All"}
              </Button>
            </div>
          </div>

          {loadingEmployees || loadingAttendance ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono">{emp.employee_id || "-"}</TableCell>
                      <TableCell>{emp.full_name || "-"}</TableCell>
                      <TableCell>
                        <Select
                          value={emp.status}
                          onValueChange={(v) => updateAttendance(emp.id, "status", v)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="half_day">Half Day</SelectItem>
                            <SelectItem value="leave">Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={emp.check_in}
                          onChange={(e) => updateAttendance(emp.id, "check_in", e.target.value)}
                          className="w-28"
                          disabled={emp.status === "absent" || emp.status === "leave"}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={emp.check_out}
                          onChange={(e) => updateAttendance(emp.id, "check_out", e.target.value)}
                          className="w-28"
                          disabled={emp.status === "absent" || emp.status === "leave"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {displayData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No employees found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
