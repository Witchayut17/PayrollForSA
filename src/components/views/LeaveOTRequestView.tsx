import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  approved: "อนุมัติแล้ว",
  pending: "รอดำเนินการ",
  rejected: "ไม่อนุมัติ",
};

const leaveTypeLabels: Record<string, string> = {
  annual: "ลาพักร้อน",
  sick: "ลาป่วย",
  personal: "ลากิจ",
  maternity: "ลาคลอด",
  paternity: "ลาดูแลภรรยาคลอด",
  unpaid: "ลาไม่รับเงินเดือน",
};

export function LeaveOTRequestView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Leave form state
  const [leaveType, setLeaveType] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  
  // OT form state
  const [otDate, setOtDate] = useState("");
  const [otHours, setOtHours] = useState("");
  const [otReason, setOtReason] = useState("");

  const { data: leaveRequests, isLoading: leaveLoading } = useQuery({
    queryKey: ["leaveRequests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: otRequests, isLoading: otLoading } = useQuery({
    queryKey: ["otRequests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ot_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const leaveSubmit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("leave_requests")
        .insert({
          user_id: user!.id,
          leave_type: leaveType,
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          reason: leaveReason,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] });
      setLeaveType("");
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      toast.success("ส่งคำขอลางานเรียบร้อยแล้ว!");
    },
    onError: (error) => {
      toast.error("ส่งคำขอลางานไม่สำเร็จ: " + error.message);
    },
  });

  const otSubmit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ot_requests")
        .insert({
          user_id: user!.id,
          request_date: otDate,
          hours: parseFloat(otHours),
          reason: otReason,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["otRequests"] });
      setOtDate("");
      setOtHours("");
      setOtReason("");
      toast.success("ส่งคำขอ OT เรียบร้อยแล้ว!");
    },
    onError: (error) => {
      toast.error("ส่งคำขอ OT ไม่สำเร็จ: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !leaveStartDate || !leaveEndDate) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    leaveSubmit.mutate();
  };

  const handleOtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otDate || !otHours) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    otSubmit.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">ขอลา/ขอ OT</h1>
      </div>

      <Tabs defaultValue="leave" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leave">คำขอลางาน</TabsTrigger>
          <TabsTrigger value="ot">คำขอทำงานล่วงเวลา</TabsTrigger>
        </TabsList>

        <TabsContent value="leave" className="space-y-6">
          {/* Leave Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                สร้างคำขอลางานใหม่
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">ประเภทการลา *</Label>
                    <Select value={leaveType} onValueChange={setLeaveType}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภทการลา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">ลาพักร้อน</SelectItem>
                        <SelectItem value="sick">ลาป่วย</SelectItem>
                        <SelectItem value="personal">ลากิจ</SelectItem>
                        <SelectItem value="maternity">ลาคลอด</SelectItem>
                        <SelectItem value="paternity">ลาดูแลภรรยาคลอด</SelectItem>
                        <SelectItem value="unpaid">ลาไม่รับเงินเดือน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">วันเริ่มต้น *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">วันสิ้นสุด *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">เหตุผล</Label>
                  <Textarea
                    id="reason"
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={leaveSubmit.isPending}>
                  {leaveSubmit.isPending ? "กำลังส่ง..." : "ส่งคำขอลางาน"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Leave History */}
          <Card>
            <CardHeader>
              <CardTitle>ประวัติคำขอลางาน</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : leaveRequests && leaveRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>วันเริ่มต้น</TableHead>
                      <TableHead>วันสิ้นสุด</TableHead>
                      <TableHead>เหตุผล</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>วันที่ส่ง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{leaveTypeLabels[request.leave_type] || request.leave_type}</TableCell>
                        <TableCell>{new Date(request.start_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell>{new Date(request.end_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                            {statusLabels[request.status] || request.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString("th-TH")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">ยังไม่มีคำขอลางาน</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ot" className="space-y-6">
          {/* OT Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                สร้างคำขอทำงานล่วงเวลาใหม่
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOtSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="otDate">วันที่ *</Label>
                    <Input
                      id="otDate"
                      type="date"
                      value={otDate}
                      onChange={(e) => setOtDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otHours">จำนวนชั่วโมง *</Label>
                    <Input
                      id="otHours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      placeholder="เช่น 2.5"
                      value={otHours}
                      onChange={(e) => setOtHours(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otReason">เหตุผล</Label>
                  <Textarea
                    id="otReason"
                    placeholder="อธิบายงานที่ทำระหว่างทำงานล่วงเวลา..."
                    value={otReason}
                    onChange={(e) => setOtReason(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={otSubmit.isPending}>
                  {otSubmit.isPending ? "กำลังส่ง..." : "ส่งคำขอ OT"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* OT History */}
          <Card>
            <CardHeader>
              <CardTitle>ประวัติคำขอทำงานล่วงเวลา</CardTitle>
            </CardHeader>
            <CardContent>
              {otLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : otRequests && otRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>ชั่วโมง</TableHead>
                      <TableHead>เหตุผล</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>วันที่ส่ง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{new Date(request.request_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell>{request.hours} ชม.</TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                            {statusLabels[request.status] || request.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString("th-TH")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">ยังไม่มีคำขอทำงานล่วงเวลา</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
