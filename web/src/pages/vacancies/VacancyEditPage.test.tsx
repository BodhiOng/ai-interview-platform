import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VacancyEditPage from "./VacancyEditPage";
import { vacanciesApi } from "@/services/vacancies";

vi.mock("@/services/vacancies", () => ({
  vacanciesApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@dnd-kit/core", () => ({}));
vi.mock("@dnd-kit/sortable", () => ({}));

const mockedVacanciesApi = vi.mocked(vacanciesApi);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/vacancies/42/edit"]}>
      <Routes>
        <Route path="/vacancies/:id/edit" element={<VacancyEditPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("VacancyEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedVacanciesApi.get.mockResolvedValue({
      data: {
        vacancy: {
          id: 42,
          role_title: "Frontend Engineer",
          culture_dimensions: "Remote-first",
          competency_expectations: "Strong fundamentals",
          skills: [
            { id: 7, skill_id: 1, skill_label: "React", expected_level: 3 },
            { id: 8, skill_id: 2, skill_label: "TypeScript", expected_level: 3 },
          ],
        },
      },
    } as never);
  });

  it("preserves input and reports validation feedback when saving a removed skill fails", async () => {
    const user = userEvent.setup();
    mockedVacanciesApi.update.mockRejectedValue({
      response: { data: { errors: [{ message: "Role title is already taken" }] } },
    });

    renderPage();

    const roleTitle = await screen.findByDisplayValue("Frontend Engineer");
    await user.clear(roleTitle);
    await user.type(roleTitle, "Senior Frontend Engineer");

    const reactCard = screen.getByText("React").closest("div.border");
    expect(reactCard).not.toBeNull();
    await user.click(within(reactCard as HTMLElement).getByRole("button", { name: /remove skill/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(mockedVacanciesApi.update).toHaveBeenCalledWith(42, {
      role_title: "Senior Frontend Engineer",
      culture_dimensions: "Remote-first",
      competency_expectations: "Strong fundamentals",
      vacancy_skills_attributes: [
        { id: 8, skill_id: 2, skill_label: "TypeScript", expected_level: 3 },
        { id: 7, _destroy: true },
      ],
    }));

    expect(await screen.findByText("Role title is already taken")).toBeVisible();
    expect(roleTitle).toHaveValue("Senior Frontend Engineer");
    expect(screen.queryByText("React")).not.toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeVisible();
  });
});
