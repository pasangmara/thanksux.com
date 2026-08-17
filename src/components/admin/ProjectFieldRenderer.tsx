"use client";

/**
 * [CMS Phase C] Dynamic, schema-driven field renderer for the admin
 * project editor. Consumes one `CategoryFieldDef` (src/types/category-
 * config.ts) at a time and renders whichever existing admin form
 * primitive (src/components/admin/fields.tsx) matches `field.type` — this
 * is what replaces the old editor's static, always-all-fields-visible
 * sections with fields that vary per category, without inventing a
 * second set of input components.
 *
 * Deliberately does NOT handle `type: "gallery"` — every gallery-type
 * field (wireframes, logo, applications, brandGuidelines, the general
 * Project.gallery, …) is a section within the ONE shared `GalleryManager`
 * instance already in the editor's Media section (src/components/admin/
 * media.tsx), not a per-field widget — rebuilding that as N separate
 * gallery pickers would be exactly the "rebuild the Media Library" this
 * phase was told not to do. The project editor page filters gallery-type
 * fields out before rendering this component for a category's field list,
 * and instead scopes the shared GalleryManager's section options to that
 * category's gallery fields — see ProjectEditorPage's `gallerySections`.
 */

import type { AdminProject } from "@/lib/admin/types";
import type { CategoryFieldDef, RepeatableSubField } from "@/types/category-config";
import { getCategoryDisplayName } from "@/types/category-config";
import { PROJECT_CATEGORIES, type CustomSection, type CustomSectionItem, type ProjectCategory } from "@/types/project";
import { AnimationField } from "./AnimationField";
import {
  adminButtonSmall,
  adminButtonSmallDanger,
  adminIconButtonDanger,
  ColorField,
  Label,
  NumberField,
  ReorderControls,
  RichTextField,
  SelectField,
  TagListField,
  TextAreaField,
  TextField,
  ToggleField,
} from "./fields";
import { MediaField } from "./media";
import type { AdminMedia } from "@/lib/admin/types";

export type ProjectPatch = Partial<AdminProject>;
export type CaseStudyPatch = Partial<AdminProject["caseStudy"]>;

/**
 * Reads/writes are deliberately routed through `unknown` rather than
 * `any` — `field.scope`/`field.type` are the runtime contract that makes
 * each cast below safe (e.g. a `"tags"` field's value is always read back
 * out as `string[]`), the same way any schema-driven form has to bridge
 * "the shape is only known by a string key at compile time."
 */
function readFieldValue(project: AdminProject, field: CategoryFieldDef): unknown {
  if (field.scope === "project") {
    return (project as unknown as Record<string, unknown>)[field.key];
  }
  return (project.caseStudy as unknown as Record<string, unknown>)[field.key];
}

function writeFieldValue(
  field: CategoryFieldDef,
  value: unknown,
  onProjectChange: (patch: ProjectPatch) => void,
  onCaseStudyChange: (patch: CaseStudyPatch) => void,
) {
  if (field.scope === "project") {
    onProjectChange({ [field.key]: value } as ProjectPatch);
  } else {
    onCaseStudyChange({ [field.key]: value } as CaseStudyPatch);
  }
}

/** Optional array fields (CaseStudy tag lists) save as `undefined` when emptied, matching the sitewide "absent field renders nothing" convention — required Project-level arrays (tags/tools/services) stay `[]`. */
function tagsOnChange(field: CategoryFieldDef, values: string[]): string[] | undefined {
  if (values.length > 0) return values;
  return field.scope === "project" ? [] : undefined;
}

export function ProjectFieldRenderer({
  field,
  project,
  onProjectChange,
  onCaseStudyChange,
  projectSlug,
}: {
  field: CategoryFieldDef;
  project: AdminProject;
  onProjectChange: (patch: ProjectPatch) => void;
  onCaseStudyChange: (patch: CaseStudyPatch) => void;
  projectSlug?: string;
}) {
  const value = readFieldValue(project, field);
  const set = (v: unknown) => writeFieldValue(field, v, onProjectChange, onCaseStudyChange);
  const id = `field-${field.scope}-${String(field.key)}`;

  switch (field.type) {
    case "text":
      return (
        <TextField
          id={id}
          label={field.adminLabel}
          value={(value as string) ?? ""}
          onChange={set}
          required={field.required}
          help={field.helpText}
        />
      );

    case "url":
      return (
        <TextField
          id={id}
          label={field.adminLabel}
          type="url"
          value={(value as string) ?? ""}
          onChange={set}
          required={field.required}
          help={field.helpText ?? "Full URL, e.g. https://…"}
        />
      );

    case "textarea":
      return (
        <TextAreaField
          id={id}
          label={field.adminLabel}
          value={(value as string) ?? ""}
          onChange={(v) => set(v || undefined)}
          required={field.required}
          help={field.helpText}
          rows={3}
        />
      );

    case "richtext":
      return (
        <RichTextField
          id={id}
          label={field.adminLabel}
          value={(value as string) ?? ""}
          onChange={(v) => set(v || undefined)}
          required={field.required}
          help={field.helpText}
        />
      );

    case "number":
    case "year":
      return (
        <NumberField
          id={id}
          label={field.adminLabel}
          value={(value as number) ?? 0}
          onChange={set}
          required={field.required}
          help={field.helpText}
        />
      );

    case "toggle":
      return (
        <ToggleField
          id={id}
          label={field.adminLabel}
          checked={Boolean(value)}
          onChange={set}
          help={field.helpText}
        />
      );

    case "tags":
      return (
        <TagListField
          id={id}
          label={field.adminLabel}
          values={(value as string[]) ?? []}
          onChange={(v) => set(tagsOnChange(field, v))}
          required={field.required}
          help={field.helpText}
        />
      );

    case "select": {
      if (field.key === "category") {
        return (
          <SelectField
            id={id}
            label={field.adminLabel}
            value={(value as ProjectCategory) ?? PROJECT_CATEGORIES[0]}
            options={PROJECT_CATEGORIES}
            getOptionLabel={getCategoryDisplayName}
            required={field.required}
            help={field.helpText}
            onChange={(v) => set(v)}
          />
        );
      }
      const options = field.options ?? [];
      return (
        <SelectField
          id={id}
          label={field.adminLabel}
          value={(value as string) ?? options[0] ?? ""}
          options={options}
          required={field.required}
          help={field.helpText}
          onChange={(v) => set(v)}
        />
      );
    }

    case "repeatable":
      // customSections gets a bespoke editor (below) rather than the
      // generic RepeatableGroupField — it's the one repeatable field whose
      // items themselves contain a nested repeatable list (`items`), one
      // level deeper than the generic renderer is built for. Every other
      // repeatable field (e.g. Digital Marketing's `metrics`) still uses
      // the generic path.
      if (field.key === "customSections") {
        return (
          <CustomSectionsEditor
            value={value}
            onChange={set}
            projectSlug={projectSlug}
            adminLabel={field.adminLabel}
            helpText={field.helpText}
          />
        );
      }
      return (
        <RepeatableGroupField
          field={field}
          value={value}
          onChange={set}
          projectSlug={projectSlug}
        />
      );

    case "image":
      // No CATEGORY_CONFIG field uses this yet (every current image field
      // is an array → "gallery") — implemented for forward-compatibility
      // rather than left as a silent no-op, per the "no `any` shortcuts"
      // instruction.
      return (
        <MediaField
          label={field.adminLabel}
          media={(value as AdminMedia) ?? { kind: "placeholder", category: "brand-mark", alt: "" }}
          projectSlug={projectSlug}
          onChange={(m) => set(m)}
          help={field.helpText}
          required={field.required}
        />
      );

    case "gallery":
      // Handled by the shared GalleryManager in the editor's Media
      // section, not here — see this file's header comment. Rendering a
      // visible note rather than silently nothing, in case a future
      // category config field is added here by mistake.
      return (
        <p className="text-caption text-text-tertiary">
          {field.adminLabel} is managed in the Media section below.
        </p>
      );

    case "color":
      // No field uses this yet (see docs/CMS_CONTENT_MODEL.md §14) — wired
      // to a real ColorField (native swatch + validated hex/rgb text)
      // rather than left as a silent text-input fallback, so a future
      // color-token field works correctly the moment one is added.
      return (
        <ColorField
          id={id}
          label={field.adminLabel}
          value={(value as string) ?? ""}
          onChange={set}
          required={field.required}
          help={field.helpText}
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Repeatable groups — CaseStudy.metrics ({label,value}[]) and
// CaseStudy.customSections ({id,label,type,text?,images?}[]). Reuses the
// same fields.tsx/media.tsx primitives per sub-field rather than a new
// input language.
// ---------------------------------------------------------------------------

function blankRepeatableItem(subFields: RepeatableSubField[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const sf of subFields) {
    if (sf.type === "gallery") item[sf.key] = [];
    else if (sf.type === "tags") item[sf.key] = [];
    else if (sf.type === "select") item[sf.key] = sf.options?.[0] ?? "";
    else item[sf.key] = "";
  }
  return item;
}

function RepeatableGroupField({
  field,
  value,
  onChange,
  projectSlug,
}: {
  field: CategoryFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  projectSlug?: string;
}) {
  const subFields = field.repeatableFields ?? [];
  const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];

  function updateItem(index: number, patch: Record<string, unknown>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    const blank = blankRepeatableItem(subFields);
    if (field.key === "customSections") blank.id = `section-${Date.now()}-${items.length}`;
    onChange([...items, blank]);
  }
  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : undefined);
  }

  return (
    <div>
      <Label htmlFor={`repeatable-${String(field.key)}`} label={field.adminLabel} help={field.helpText} />
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-caption text-text-tertiary">None yet.</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-md border border-border bg-background-alt p-3">
              <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
                {subFields
                  .filter((sf) => sf.type !== "gallery")
                  .map((sf) => (
                    <RepeatableSubFieldInput
                      key={sf.key}
                      idPrefix={`repeatable-${String(field.key)}-${i}`}
                      subField={sf}
                      value={item[sf.key]}
                      onChange={(v) => updateItem(i, { [sf.key]: v })}
                    />
                  ))}
              </div>
              {subFields
                .filter((sf) => sf.type === "gallery")
                .map((sf) => (
                  <RepeatableImagesSubField
                    key={sf.key}
                    label={sf.label}
                    images={(item[sf.key] as AdminMedia[]) ?? []}
                    onChange={(imgs) => updateItem(i, { [sf.key]: imgs })}
                    projectSlug={projectSlug}
                  />
                ))}
              <button
                type="button"
                onClick={() => removeItem(i)}
                className={`self-start ${adminButtonSmallDanger}`}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={addItem}
        className={`mt-2 ${adminButtonSmall}`}
      >
        + Add {field.adminLabel}
      </button>
    </div>
  );
}

function RepeatableSubFieldInput({
  idPrefix,
  subField,
  value,
  onChange,
}: {
  idPrefix: string;
  subField: RepeatableSubField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const id = `${idPrefix}-${subField.key}`;
  switch (subField.type) {
    case "textarea":
      return (
        <TextAreaField id={id} label={subField.label} value={(value as string) ?? ""} onChange={onChange} rows={2} />
      );
    case "select":
      return (
        <SelectField
          id={id}
          label={subField.label}
          value={(value as string) ?? subField.options?.[0] ?? ""}
          options={subField.options ?? []}
          onChange={onChange}
        />
      );
    case "tags":
      return (
        <TagListField id={id} label={subField.label} values={(value as string[]) ?? []} onChange={onChange} />
      );
    default:
      return <TextField id={id} label={subField.label} value={(value as string) ?? ""} onChange={onChange} />;
  }
}

function RepeatableImagesSubField({
  label,
  images,
  onChange,
  projectSlug,
}: {
  label: string;
  images: AdminMedia[];
  onChange: (images: AdminMedia[]) => void;
  projectSlug?: string;
}) {
  function updateAt(index: number, media: AdminMedia) {
    onChange(images.map((m, i) => (i === index ? media : m)));
  }
  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...images, { kind: "placeholder", category: "brand-mark", alt: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption font-medium text-ink">{label}</p>
      {images.map((media, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            <MediaField label={`${label} #${i + 1}`} media={media} projectSlug={projectSlug} onChange={(m) => updateAt(i, m)} />
          </div>
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label="Remove image"
            title="Remove image"
            className={`mt-6 ${adminIconButtonDanger}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className={`self-start ${adminButtonSmall}`}
      >
        + Add image
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// [CMS Phase D1] Custom Sections — a bespoke editor for
// `CaseStudy.customSections` (project.ts), not the generic
// `RepeatableGroupField` above. Reuses the same TextField/TextAreaField/
// MediaField primitives as everywhere else in this file; the only reason
// this isn't generic is that a `CustomSection` itself contains a nested
// repeatable list (`items`) — one level deeper than `RepeatableGroupField`
// is built for.
// ---------------------------------------------------------------------------

function blankCustomSection(index: number): CustomSection {
  return { id: `section-${Date.now()}-${index}`, label: "", type: "text", order: index, visible: true };
}

function CustomSectionsEditor({
  value,
  onChange,
  projectSlug,
  adminLabel,
  helpText,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  projectSlug?: string;
  adminLabel: string;
  helpText?: string;
}) {
  const sections = (Array.isArray(value) ? value : []) as CustomSection[];

  function updateSection(index: number, patch: Partial<CustomSection>) {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function removeSection(index: number) {
    const next = sections.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : undefined);
  }
  function addSection() {
    onChange([...sections, blankCustomSection(sections.length)]);
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((s, i) => ({ ...s, order: i })));
  }

  return (
    <div>
      <Label htmlFor="customSections" label={adminLabel} help={helpText} />
      <div className="flex flex-col gap-3">
        {sections.length === 0 ? (
          <p className="text-caption text-text-tertiary">No custom sections yet.</p>
        ) : (
          sections.map((section, i) => (
            <div key={section.id} className="flex flex-col gap-3 rounded-md border border-border bg-background-alt p-3">
              <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
                <TextField
                  id={`custom-${section.id}-label`}
                  label="Section Title"
                  value={section.label}
                  onChange={(v) => updateSection(i, { label: v })}
                />
                <TextField
                  id={`custom-${section.id}-description`}
                  label="Short Description"
                  value={section.description ?? ""}
                  onChange={(v) => updateSection(i, { description: v || undefined })}
                />
              </div>
              <TextAreaField
                id={`custom-${section.id}-text`}
                label="Body / Content"
                value={section.text ?? ""}
                onChange={(v) => updateSection(i, { text: v || undefined })}
                rows={3}
              />
              <MediaField
                label="Image"
                media={section.image ?? { kind: "placeholder", category: "brand-mark", alt: "" }}
                projectSlug={projectSlug}
                onChange={(m) => updateSection(i, { image: m })}
              />
              <RepeatableImagesSubField
                label="Gallery"
                images={section.images ?? []}
                onChange={(imgs) => updateSection(i, { images: imgs })}
                projectSlug={projectSlug}
              />
              <CustomSectionItemsEditor
                items={section.items ?? []}
                onChange={(items) => updateSection(i, { items: items.length > 0 ? items : undefined })}
              />
              <ToggleField
                id={`custom-${section.id}-visible`}
                label="Visible"
                checked={section.visible !== false}
                onChange={(v) => updateSection(i, { visible: v })}
                help="Off = kept here, not shown publicly"
              />
              <AnimationField
                label={`Animation — Section ${i + 1}`}
                animation={section.animation}
                onChange={(animation) => updateSection(i, { animation })}
              />
              <div className="border-t border-border pt-3">
                <ReorderControls
                  canMoveUp={i > 0}
                  canMoveDown={i < sections.length - 1}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  onRemove={() => removeSection(i)}
                  removeLabel="Remove section"
                />
              </div>
            </div>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={addSection}
        className={`mt-2 ${adminButtonSmall}`}
      >
        + Add Section
      </button>
    </div>
  );
}

function CustomSectionItemsEditor({
  items,
  onChange,
}: {
  items: CustomSectionItem[];
  onChange: (items: CustomSectionItem[]) => void;
}) {
  function updateItem(index: number, patch: Partial<CustomSectionItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function addItem() {
    onChange([...items, { id: `item-${Date.now()}-${items.length}`, label: "" }]);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-3">
      <p className="text-caption font-medium text-ink">
        Repeatable Items <span className="text-text-tertiary">(optional)</span>
      </p>
      {items.length === 0 ? (
        <p className="text-caption text-text-tertiary">None yet.</p>
      ) : (
        items.map((item, i) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-sm border border-border bg-surface p-2 tablet:flex-row tablet:items-start">
            <div className="flex-1">
              <TextField id={`${item.id}-label`} label="Label" value={item.label} onChange={(v) => updateItem(i, { label: v })} />
            </div>
            <div className="flex-[2]">
              <TextAreaField
                id={`${item.id}-text`}
                label="Text"
                value={item.text ?? ""}
                onChange={(v) => updateItem(i, { text: v || undefined })}
                rows={2}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              aria-label="Remove item"
              title="Remove item"
              className={`shrink-0 self-start tablet:mt-6 ${adminIconButtonDanger}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))
      )}
      <button
        type="button"
        onClick={addItem}
        className={`self-start ${adminButtonSmall}`}
      >
        + Add item
      </button>
    </div>
  );
}
