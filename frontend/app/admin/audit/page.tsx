"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/Pagination";
import { RefreshCw, Shield } from "lucide-react";

interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface AuditStats {
  total_actions: number;
  action_breakdown: Record<string, number>;
  resource_breakdown: Record<string, number>;
  period_days: number;
}

const ACTION_VARIANTS: Record<string, "info" | "danger" | "success" | "warning" | "gray"> = {
  claim_session: "info",
  close_session: "danger",
  send_message: "success",
  create: "warning",
  update: "warning",
  delete: "danger",
  login: "gray",
  logout: "gray",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState({
    action: "",
    resource_type: ""
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        days: String(days)
      });
      if (filter.action) params.append("action", filter.action);
      if (filter.resource_type) params.append("resource_type", filter.resource_type);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/v1/admin/audit/logs?${params}`),
        fetch(`/api/v1/admin/audit/stats?days=${days}`)
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs);
        setTotal(logsData.total);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [days, filter.action, filter.resource_type, limit, offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const canGoPrev = offset > 0;
  const canGoNext = offset + limit < total;

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-brand-600" />
          <h1 className="text-2xl font-bold">Audit Logs</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Last</span>
            <Input
              type="number"
              value={days}
              onChange={(e) => {
                setDays(Number(e.target.value));
                setOffset(0);
              }}
              className="w-20"
              min={1}
              max={90}
            />
            <span className="text-sm text-text-secondary">days</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Total Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_actions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Top Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.action_breakdown)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([action, count]) => (
                    <Badge key={action} variant="secondary" className="text-xs">
                      {action}: {count}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                By Resource Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.resource_breakdown)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}: {count}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Filter by action..."
          value={filter.action}
          onChange={(e) => {
            setFilter({ ...filter, action: e.target.value });
            setOffset(0);
          }}
          className="w-48"
        />
        <Input
          placeholder="Filter by resource type..."
          value={filter.resource_type}
          onChange={(e) => {
            setFilter({ ...filter, resource_type: e.target.value });
            setOffset(0);
          }}
          className="w-48"
        />
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                <TableHead>Time</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-text-secondary">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.admin_name || `Admin ${log.admin_id}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANTS[log.action] || "gray"} size="sm">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-text-secondary">{log.resource_type}</span>
                      {log.resource_id && (
                        <span className="ml-1 text-xs">({log.resource_id})</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {log.details ? `${JSON.stringify(log.details).slice(0, 50)}...` : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-text-secondary">
                      {log.ip_address}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4">
            <div className="text-sm text-text-secondary">
              Showing {logs.length} of {total} results
            </div>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (canGoPrev) setOffset(Math.max(0, offset - limit));
                    }}
                    className={!canGoPrev ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive onClick={(event) => event.preventDefault()}>
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (canGoNext) setOffset(offset + limit);
                    }}
                    className={!canGoNext ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="w-full text-right text-xs text-text-secondary md:w-auto">
              Page {currentPage} of {totalPages || 1}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
