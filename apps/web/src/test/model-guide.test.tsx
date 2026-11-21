import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ModelGuidePage from "@/app/(app)/guide/page";

const BASE_URL = "http://localhost:8000";

function model(overrides: Record<string, unknown>) {
  return {
    id: overrides.slug,
    slug: "model",
    display_name: "Model",
    task_type: "text_to_image",
    provider_id: "replicate",
    input_schema: { type: "object", properties: {} },
    default_params: {},
    cost_credits: "1.00",
    required_input_roles: [],
    ...overrides,
  };
}

const MODELS = [
  model({
    slug: "replicate-flux-1-1-pro",
    display_name: "FLUX 1.1 Pro (High Fidelity Image)",
    task_type: "text_to_image",
    cost_credits: "4.00",
  }),
  model({
    slug: "replicate-flux-schnell",
    display_name: "FLUX Schnell (Fast Image)",
    task_type: "text_to_image",
    cost_credits: "1.00",
  }),
  model({
    slug: "replicate-unreviewed-model",
    display_name: "Unreviewed Model",
    task_type: "text_to_image",
    provider_id: "fal",
    cost_credits: "2.00",
  }),
  model({
    slug: "replicate-flux-kontext-pro",
    display_name: "FLUX.1 Kontext Pro (Instruction Edit)",
    task_type: "image_to_image",
    cost_credits: "5.00",
  }),
  model({
    slug: "replicate-veo-3-1-fast",
    display_name: "Google Veo 3.1 Fast (Text to Video)",
    task_type: "text_to_video",
    cost_credits: "120.00",
  }),
  model({
    slug: "replicate-kling-2-6-i2v",
    display_name: "Kling 2.6 (Image to Video)",
    task_type: "image_to_video",
    cost_credits: "70.00",
  }),
];

const server = setupServer(
  http.get(`${BASE_URL}/v1/models`, () => HttpResponse.json(MODELS))
);

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      }),
    },
  }),
}));

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderGuide() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ModelGuidePage />
    </QueryClientProvider>
  );
}

describe("Model Guide page", () => {
  it("renders goal-based quick picks with live credit costs", async () => {
    renderGuide();

    expect(
      await screen.findByRole("heading", { name: "Model Guide" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Fast, affordable drafts" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("FLUX Schnell (Fast Image)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1 cr").length).toBeGreaterThan(0);
    expect(screen.getByText("6 models enabled")).toBeInTheDocument();
  });

  it("groups models by task and marks the editorial recommendation", async () => {
    renderGuide();

    await screen.findByRole("heading", { name: "Model Guide" });

    const textToImage = screen.getByRole("region", {
      name: "Text to image",
    });
    expect(
      within(textToImage).getAllByText("FLUX 1.1 Pro (High Fidelity Image)")
    ).not.toHaveLength(0);
    expect(
      within(textToImage).getAllByText("Recommended").length
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole("region", { name: "Image to video" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("120").length).toBeGreaterThan(0);
  });

  it("falls back gracefully for models without editorial notes", async () => {
    renderGuide();

    await screen.findByRole("heading", { name: "Model Guide" });

    expect(
      screen.getAllByText(
        "Available in the model registry. No editorial notes yet."
      ).length
    ).toBeGreaterThan(0);
  });

  it("re-sorts the comparison table when a filter is selected", async () => {
    renderGuide();

    await screen.findByRole("heading", { name: "Model Guide" });

    const section = screen.getByRole("region", { name: "Text to image" });
    const fastest = within(section).getByRole("button", { name: "Fastest" });

    expect(fastest).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(fastest);
    expect(fastest).toHaveAttribute("aria-pressed", "true");

    const rowHeaders = within(section).getAllByRole("rowheader");
    expect(rowHeaders[0]).toHaveTextContent("FLUX Schnell (Fast Image)");
  });
});
