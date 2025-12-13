import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "employee" | "hr" | "accountant" | "admin";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching role:", error);
        setRole("employee"); // Default to employee
      } else {
        setRole(data?.role as AppRole || "employee");
      }
      setLoading(false);
    }

    fetchRole();
  }, [user]);

  return { role, loading };
}
