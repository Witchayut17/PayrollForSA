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
      toast.success("Leave request submitted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to submit leave request: " + error.message);
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
      toast.success("OT request submitted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to submit OT request: " + error.message);
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
      toast.error("Please fill in all required fields");
      return;
    }
    leaveSubmit.mutate();
  };

  const handleOtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otDate || !otHours) {
      toast.error("Please fill in all required fields");
      return;
    }
    otSubmit.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Leave & OT Request</h1>
      </div>

      <Tabs defaultValue="leave" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leave">Leave Request</TabsTrigger>
          <TabsTrigger value="ot">Overtime Request</TabsTrigger>
        </TabsList>

        <TabsContent value="leave" className="space-y-6">
          {/* Leave Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Leave Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Leave Type *</Label>
                    <Select value={leaveType} onValueChange={setLeaveType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Provide additional details..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={leaveSubmit.isPending}>
                  {leaveSubmit.isPending ? "Submitting..." : "Submit Leave Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Leave History */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Request History</CardTitle>
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
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="capitalize">{request.leave_type}</TableCell>
                        <TableCell>{new Date(request.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(request.end_date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No leave requests yet.</p>
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
                New Overtime Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOtSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="otDate">Date *</Label>
                    <Input
                      id="otDate"
                      type="date"
                      value={otDate}
                      onChange={(e) => setOtDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otHours">Hours *</Label>
                    <Input
                      id="otHours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      placeholder="e.g., 2.5"
                      value={otHours}
                      onChange={(e) => setOtHours(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otReason">Reason</Label>
                  <Textarea
                    id="otReason"
                    placeholder="Describe the work done during overtime..."
                    value={otReason}
                    onChange={(e) => setOtReason(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={otSubmit.isPending}>
                  {otSubmit.isPending ? "Submitting..." : "Submit OT Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* OT History */}
          <Card>
            <CardHeader>
              <CardTitle>Overtime Request History</CardTitle>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{new Date(request.request_date).toLocaleDateString()}</TableCell>
                        <TableCell>{request.hours} hrs</TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">No overtime requests yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
