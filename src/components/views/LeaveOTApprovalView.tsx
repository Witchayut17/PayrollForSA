import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at: string;
  employee_name?: string;
  employee_id?: string;
}

interface OTRequest {
  id: string;
  user_id: string;
  request_date: string;
  hours: number;
  reason: string | null;
  status: string;
  created_at: string;
  employee_name?: string;
  employee_id?: string;
}

export function LeaveOTApprovalView() {
  const { user } = useAuth();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedOT, setSelectedOT] = useState<OTRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, employee_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: leaveRequests = [], isLoading: loadingLeave } = useQuery({
    queryKey: ["all-leave-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: otRequests = [], isLoading: loadingOT } = useQuery({
    queryKey: ["all-ot-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ot_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getEmployeeInfo = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    return {
      name: profile?.full_name || "Unknown",
      employee_id: profile?.employee_id || "-",
    };
  };

  const updateLeaveRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-leave-requests"] });
      toast.success("Leave request updated");
      setSelectedLeave(null);
      setReviewNotes("");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const updateOTRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ot_requests")
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-ot-requests"] });
      toast.success("OT request updated");
      setSelectedOT(null);
      setReviewNotes("");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const pendingLeave = leaveRequests.filter((r) => r.status === "pending");
  const pendingOT = otRequests.filter((r) => r.status === "pending");

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Leave & OT Approval
            {(pendingLeave.length > 0 || pendingOT.length > 0) && (
              <Badge variant="destructive" className="ml-2">
                {pendingLeave.length + pendingOT.length} Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="leave">
            <TabsList className="mb-4">
              <TabsTrigger value="leave">
                Leave Requests
                {pendingLeave.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingLeave.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ot">
                OT Requests
                {pendingOT.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingOT.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leave">
              {loadingLeave ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => {
                      const emp = getEmployeeInfo(request.user_id);
                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{emp.name}</p>
                              <p className="text-sm text-muted-foreground">{emp.employee_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{request.leave_type}</TableCell>
                          <TableCell>
                            {format(new Date(request.start_date), "MMM d")} - {format(new Date(request.end_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedLeave({ ...request, employee_name: emp.name, employee_id: emp.employee_id });
                                setReviewNotes("");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {leaveRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No leave requests
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="ot">
              {loadingOT ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otRequests.map((request) => {
                      const emp = getEmployeeInfo(request.user_id);
                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{emp.name}</p>
                              <p className="text-sm text-muted-foreground">{emp.employee_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(request.request_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{request.hours} hrs</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOT({ ...request, employee_name: emp.name, employee_id: emp.employee_id });
                                setReviewNotes("");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {otRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No OT requests
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Leave Request Detail Dialog */}
      <Dialog open={!!selectedLeave} onOpenChange={() => setSelectedLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee</p>
                  <p className="font-medium">{selectedLeave.employee_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{selectedLeave.employee_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leave Type</p>
                  <p className="font-medium capitalize">{selectedLeave.leave_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedLeave.status)}
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Date Range</p>
                  <p className="font-medium">
                    {format(new Date(selectedLeave.start_date), "MMMM d, yyyy")} - {format(new Date(selectedLeave.end_date), "MMMM d, yyyy")}
                  </p>
                </div>
                {selectedLeave.reason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Reason</p>
                    <p>{selectedLeave.reason}</p>
                  </div>
                )}
              </div>

              {selectedLeave.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Review Notes (Optional)</p>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes for the employee..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => updateLeaveRequest.mutate({ id: selectedLeave.id, status: "approved" })}
                      disabled={updateLeaveRequest.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateLeaveRequest.mutate({ id: selectedLeave.id, status: "rejected" })}
                      disabled={updateLeaveRequest.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OT Request Detail Dialog */}
      <Dialog open={!!selectedOT} onOpenChange={() => setSelectedOT(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OT Request Details</DialogTitle>
          </DialogHeader>
          {selectedOT && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee</p>
                  <p className="font-medium">{selectedOT.employee_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{selectedOT.employee_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedOT.request_date), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hours</p>
                  <p className="font-medium">{selectedOT.hours} hours</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOT.status)}
                </div>
                {selectedOT.reason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Reason</p>
                    <p>{selectedOT.reason}</p>
                  </div>
                )}
              </div>

              {selectedOT.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Review Notes (Optional)</p>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes for the employee..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => updateOTRequest.mutate({ id: selectedOT.id, status: "approved" })}
                      disabled={updateOTRequest.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateOTRequest.mutate({ id: selectedOT.id, status: "rejected" })}
                      disabled={updateOTRequest.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
