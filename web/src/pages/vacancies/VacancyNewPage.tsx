import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import LevelRadio from "@/components/assessment/LevelRadio";
import SkillPicker from "@/components/assessment/SkillPicker";
import { vacanciesApi } from "@/services/vacancies";
import { ArrowLeft, ChevronDown, ChevronRight, Plus, X, Loader2 } from "lucide-react";
import type { VacancySkill } from "@/types";

interface VacancyFormValues {
  role_title: string;
  culture_dimensions: string;
  competency_expectations: string;
  skills: Partial<VacancySkill>[];
}

export default function VacancyNewPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<VacancyFormValues>({
    defaultValues: { role_title: "", culture_dimensions: "", competency_expectations: "", skills: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "skills" });

  const toggleSkill = (skillId: string) => {
    setExpandedSkills((current) => {
      const next = new Set(current);
      next.has(skillId) ? next.delete(skillId) : next.add(skillId);
      return next;
    });
  };

  const onSubmit = async (data: VacancyFormValues) => {
    setError(null);
    setSubmitting(true);
    try {
      await vacanciesApi.create({
        role_title: data.role_title,
        culture_dimensions: data.culture_dimensions,
        competency_expectations: data.competency_expectations,
        vacancy_skills_attributes: data.skills,
      });
      navigate("/vacancies");
    } catch (e: any) {
      setError(e?.response?.data?.errors?.[0]?.message ?? "Failed to save vacancy.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/vacancies" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm text-muted-foreground">Vacancies</span>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">New Vacancy</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="role_title">Role title <span className="text-destructive">*</span></Label>
          <Input id="role_title" placeholder="Senior Frontend Engineer" {...register("role_title", { required: true })} />
        </div>

        <Separator />

        {/* Expected skills */}
        <div className="space-y-3">
          <Label>Expected skills</Label>

          {fields.length === 0 ? (
            <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground">
              No skills added yet.
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg">
                  <div className="flex cursor-pointer items-center gap-2 p-3 hover:bg-muted/30" role="button" tabIndex={0} aria-expanded={expandedSkills.has(field.id)} onClick={() => toggleSkill(field.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleSkill(field.id); } }}>
                    <span className="rounded p-1 text-muted-foreground" aria-hidden="true">{expandedSkills.has(field.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{watch(`skills.${index}.skill_label`)}</span>
                    <button type="button" onClick={(event) => { event.stopPropagation(); remove(index); }} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${watch(`skills.${index}.skill_label`)}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {expandedSkills.has(field.id) && <div className="border-t px-3 pb-3 pt-3"><div className="space-y-1"><span className="text-xs text-muted-foreground">Required proficiency</span><LevelRadio value={watch(`skills.${index}.expected_level`) ?? 3} onChange={(v) => setValue(`skills.${index}.expected_level`, v, { shouldDirty: true, shouldValidate: true })} /></div></div>}
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add skill expectation
          </Button>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="culture_dimensions">Company culture (used in AI narrative)</Label>
          <Textarea
            id="culture_dimensions"
            placeholder="Ownership-driven, async-first, direct feedback culture..."
            rows={3}
            {...register("culture_dimensions")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="competency_expectations">Competency expectations (used in AI narrative)</Label>
          <Textarea
            id="competency_expectations"
            placeholder="Strong communicator who can align cross-functional teams..."
            rows={3}
            {...register("competency_expectations")}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/vacancies")}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Vacancy
          </Button>
        </div>
      </form>

      <SkillPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(s) => append({ skill_id: s.skill_id, skill_label: s.skill_label, expected_level: 3 })}
      />
    </div>
  );
}
