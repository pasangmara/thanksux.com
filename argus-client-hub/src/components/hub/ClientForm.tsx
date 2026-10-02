"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, PartyPopper, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClientAction, updateClientAction } from "@/app/hub/actions/clients";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Label, SelectField, TextField, FieldError } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { CLIENT_STATUS_META, SERVICE_LABEL } from "@/lib/domain/labels";
import { CLIENT_STATUSES, SERVICES, type Client, type Service } from "@/lib/domain/types";
import { feedbackUrl } from "@/lib/services/links";
import { LinkButtons } from "./LinkActions";

function ClientFields({ initial, errors }: { initial?: Client; errors: Record<string, string> }) {
  const [services, setServices] = useState<Service[]>(initial?.services ?? []);
  const toggle = (s: Service) => setServices((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Client name" name="name" required defaultValue={initial?.name} error={errors.name} placeholder="e.g. Sabbir Ahmed" autoComplete="off" />
        <TextField label="Company" name="company" defaultValue={initial?.company ?? ""} error={errors.company} placeholder="e.g. Orbit Clinic" autoComplete="off" />
        <TextField label="WhatsApp" name="whatsapp" type="tel" inputMode="tel" defaultValue={initial?.whatsapp ?? ""} error={errors.whatsapp} placeholder="+880 17XX-XXXXXX" />
        <TextField label="Email" name="email" type="email" defaultValue={initial?.email ?? ""} error={errors.email} placeholder="name@company.com" />
      </div>
      <div>
        <Label>Services</Label>
        <div role="group" aria-label="Services" className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <Chip key={s} size="sm" selected={services.includes(s)} onClick={() => toggle(s)}>
              {SERVICE_LABEL[s].en}
            </Chip>
          ))}
        </div>
        {services.map((s) => (
          <input key={s} type="hidden" name="services" value={s} />
        ))}
        <FieldError>{errors.services}</FieldError>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Project / package" name="package" defaultValue={initial?.package ?? ""} error={errors.package} placeholder="e.g. Website · Business" />
        <SelectField label="Status" name="status" defaultValue={initial?.status ?? "onboarding"} error={errors.status}>
          {CLIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CLIENT_STATUS_META[s].label}
            </option>
          ))}
        </SelectField>
        <TextField label="Start date" name="start_date" type="date" defaultValue={initial?.start_date ?? ""} error={errors.start_date} />
        <TextField label="End date" name="end_date" type="date" defaultValue={initial?.end_date ?? ""} error={errors.end_date} />
        <SelectField label="Form language" name="preferred_language" defaultValue={initial?.preferred_language ?? "en"}>
          <option value="en">English first</option>
          <option value="bn">বাংলা first</option>
        </SelectField>
      </div>
    </div>
  );
}

function ClientModal({
  open,
  onClose,
  initial,
  baseUrl,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Client;
  baseUrl: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Client | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const close = () => {
    onClose();
    setTimeout(() => {
      setCreated(null);
      setErrors({});
    }, 250);
  };

  const submit = (fd: FormData) =>
    start(async () => {
      const res = initial ? await updateClientAction(initial.id, fd) : await createClientAction(fd);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      router.refresh();
      if (initial) {
        toast.success("Client saved");
        close();
      } else {
        setCreated(res.data);
      }
    });

  return (
    <Modal
      open={open}
      onClose={close}
      title={created ? "Client added" : initial ? "Edit client" : "Add client"}
      description={created ? undefined : initial ? undefined : "A personal feedback link is created automatically."}
    >
      <AnimatePresence mode="wait" initial={false}>
        {created ? (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
            <div className="flex items-start gap-3 rounded-2xl border border-mint/30 bg-mint-soft/60 p-4">
              <PartyPopper className="mt-0.5 size-5 shrink-0 text-mint" />
              <div className="min-w-0">
                <p className="font-medium text-text">{created.name} is in.</p>
                <p className="mt-0.5 text-[13px] text-text-2">Send the personal link now, or later from the Clients list once the project is done.</p>
              </div>
            </div>
            <div>
              <Label>Feedback link</Label>
              <p className="field truncate font-mono text-[13px] text-text-2 select-all">{feedbackUrl(baseUrl, created.feedback_code)}</p>
            </div>
            <LinkButtons client={created} baseUrl={baseUrl} />
            <div className="flex justify-end border-t border-line pt-4">
              <Button variant="ghost" onClick={close}>
                Done
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // onSubmit (not action=) so the fields keep their values when validation fails.
            onSubmit={(e) => {
              e.preventDefault();
              submit(new FormData(e.currentTarget));
            }}
            className="flex flex-col gap-6"
            noValidate
          >
            <ClientFields initial={initial} errors={errors} />
            <div className="flex justify-end gap-2 border-t border-line pt-5">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={pending} icon={<Check className="size-4" />}>
                {initial ? "Save changes" : "Save client"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}

export function AddClientButton({ baseUrl, label = "Add client" }: { baseUrl: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" icon={<Plus className="size-4" strokeWidth={2.5} />} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ClientModal open={open} onClose={() => setOpen(false)} baseUrl={baseUrl} />
    </>
  );
}

export function EditClientButton({ client, baseUrl }: { client: Client; baseUrl: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setOpen(true)}>
        Edit
      </Button>
      <ClientModal open={open} onClose={() => setOpen(false)} initial={client} baseUrl={baseUrl} />
    </>
  );
}
