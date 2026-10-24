import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { assessmentsApi } from "@/services/assessments";
import { Plus, Clock, ChevronRight, Archive } from "lucide-react";
import type { Assessment } from "@/types";

function SessionSummary({ session }: { session?: Assessment["latest_session"] }) {
  if (!session) return null;

  if (session.status === "active")
    return (
      <span className="flex items-center gap-1 text-xs text-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Live now
      </span>
    );

  if (session.status === "ended" && session.end_reason === "error")
    return <span className="text-xs text-destructive">Last: failed</span>;

  if (session.status === "ended")
    return <span className="text-xs text-muted-foreground">Last: completed</span>;

  return <span className="text-xs text-muted-foreground">Awaiting candidate</span>;
}

export default function AssessmentListPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    assessmentsApi
      .list(1, showArchived)
      .then((res) => setAssessments(res.data.assessments))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [showArchived]);

  const archiveSelected = async () => {
    if (!selectedIds.length || !window.confirm(`Archive ${selectedIds.length} assessment(s)?`)) return;
    setArchiving(true);
    try {
      await assessmentsApi.bulkArchive(selectedIds);
      setAssessments((current) => current.filter((assessment) => !selectedIds.includes(assessment.id)));
      setSelectedIds([]);
    } catch { setError(true); } finally { setArchiving(false); }
  };

  const unarchiveOne = async (id: number) => {
    setArchiving(true);
    try {
      await assessmentsApi.unarchive(id);
      setAssessments((current) => current.filter((assessment) => assessment.id !== id));
    } catch { setError(true); } finally { setArchiving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Assessments</h1>
        <div className="flex gap-2">
          {!showArchived && !selectionMode && <Button variant="outline" onClick={() => setSelectionMode(true)}>Select</Button>}
          {!showArchived && selectionMode && (
            <>
              <Button variant="outline" onClick={() => setSelectedIds(assessments.length > 0 && assessments.length === selectedIds.length ? [] : assessments.map((assessment) => assessment.id))}>
                {assessments.length > 0 && assessments.length === selectedIds.length ? "Clear all" : "Select all"}
              </Button>
              {selectedIds.length > 0 && <Button variant="outline" onClick={archiveSelected} disabled={archiving}><Archive className="h-4 w-4 mr-1.5" />Archive selected</Button>}
              <Button variant="ghost" onClick={() => { setSelectionMode(false); setSelectedIds([]); }}>Cancel</Button>
            </>
          )}
          <Button onClick={() => navigate("/assessments/new")}><Plus className="h-4 w-4 mr-1.5" />New Assessment</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={!showArchived ? "default" : "outline"} onClick={() => { setShowArchived(false); setSelectedIds([]); setSelectionMode(false); }}>Active</Button>
        <Button variant={showArchived ? "default" : "outline"} onClick={() => { setShowArchived(true); setSelectedIds([]); setSelectionMode(false); }}>Archived</Button>
      </div>

      {error && (
        <div className="border border-destructive/40 rounded-lg p-4 text-sm text-destructive">
          Failed to load assessments. Please refresh the page.
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : assessments.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground">
          <p className="mb-3">No assessments yet.</p>
          <Button variant="outline" onClick={() => navigate("/assessments/new")}>
            <Plus className="h-4 w-4 mr-1.5" /> Create your first assessment
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {assessments.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate(`/assessments/${a.id}/invite`)}
            >
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectionMode && <input type="checkbox" aria-label={`Select ${a.name}`} checked={selectedIds.includes(a.id)} onChange={() => setSelectedIds((current) => current.includes(a.id) ? current.filter((id) => id !== a.id) : [...current, a.id])} onClick={(event) => event.stopPropagation()} />}
                  <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.time_limit_min} min
                    </span>
                    {a.latest_session && (
                      <>
                        <span>·</span>
                        <SessionSummary session={a.latest_session} />
                      </>
                    )}
                  </div>
                </div>
                </div>
                <div className="flex items-center gap-2">
                  {showArchived && <Button variant="outline" size="sm" disabled={archiving} onClick={(event) => { event.stopPropagation(); unarchiveOne(a.id); }}>Unarchive</Button>}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
