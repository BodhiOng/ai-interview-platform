import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { vacanciesApi } from "@/services/vacancies";
import { Plus, Briefcase, ChevronRight, Archive } from "lucide-react";
import type { Vacancy } from "@/types";

export default function VacancyListPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(false);
    vacanciesApi.list(1, showArchived)
      .then((res) => setVacancies(res.data.vacancies))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [showArchived]);

  const archiveSelected = async () => {
    if (!selectedIds.length || !window.confirm(`Archive ${selectedIds.length} vacancy(ies)?`)) return;
    setArchiving(true);
    try {
      await vacanciesApi.bulkArchive(selectedIds);
      setVacancies((current) => current.filter((vacancy) => !selectedIds.includes(vacancy.id)));
      setSelectedIds([]);
    } catch { setError(true); } finally { setArchiving(false); }
  };

  const unarchiveOne = async (id: number) => {
    setArchiving(true);
    try {
      await vacanciesApi.unarchive(id);
      setVacancies((current) => current.filter((vacancy) => vacancy.id !== id));
    } catch { setError(true); } finally { setArchiving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vacancies</h1>
        <div className="flex gap-2">
          {!showArchived && !selectionMode && <Button variant="outline" onClick={() => setSelectionMode(true)}>Select</Button>}
          {!showArchived && selectionMode && (
            <>
              <Button variant="outline" onClick={() => setSelectedIds(vacancies.length > 0 && vacancies.length === selectedIds.length ? [] : vacancies.map((vacancy) => vacancy.id))}>
                {vacancies.length > 0 && vacancies.length === selectedIds.length ? "Clear all" : "Select all"}
              </Button>
              {selectedIds.length > 0 && <Button variant="outline" onClick={archiveSelected} disabled={archiving}><Archive className="h-4 w-4 mr-1.5" />Archive selected</Button>}
              <Button variant="ghost" onClick={() => { setSelectionMode(false); setSelectedIds([]); }}>Cancel</Button>
            </>
          )}
          <Button onClick={() => navigate("/vacancies/new")}><Plus className="h-4 w-4 mr-1.5" />New Vacancy</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={!showArchived ? "default" : "outline"} onClick={() => { setShowArchived(false); setSelectedIds([]); setSelectionMode(false); }}>Active</Button>
        <Button variant={showArchived ? "default" : "outline"} onClick={() => { setShowArchived(true); setSelectedIds([]); setSelectionMode(false); }}>Archived</Button>
      </div>

      {error && (
        <div className="border border-destructive/40 rounded-lg p-4 text-sm text-destructive">
          Failed to load vacancies. Please refresh the page.
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : vacancies.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground">
          <p className="mb-3">No vacancies yet.</p>
          <Button variant="outline" onClick={() => navigate("/vacancies/new")}>
            <Plus className="h-4 w-4 mr-1.5" /> Create your first vacancy
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {vacancies.map((v) => (
            <Card
              key={v.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate(`/vacancies/${v.id}/edit`)}
            >
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectionMode && <input type="checkbox" aria-label={`Select ${v.role_title}`} checked={selectedIds.includes(v.id)} onChange={() => setSelectedIds((current) => current.includes(v.id) ? current.filter((id) => id !== v.id) : [...current, v.id])} onClick={(event) => event.stopPropagation()} />}
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{v.role_title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {showArchived && <Button variant="outline" size="sm" disabled={archiving} onClick={(event) => { event.stopPropagation(); unarchiveOne(v.id); }}>Unarchive</Button>}
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
