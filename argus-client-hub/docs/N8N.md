# n8n + Google Sheet integration

The app sends every important change to **one n8n webhook**. n8n then:

1. appends or updates the row in the **Google Sheet** ("ARGUS · Client Feedback"),
2. sends **WhatsApp + email** alerts to the team (urgent when the rating is 3★ or lower),
3. optionally runs the daily reminder.

n8n is not connected yet. Until it is, events are stored in the `outbox` table with status `pending` and shown in **Settings → Event log**. Nothing is lost.

## 1. Connect

1. In n8n, create a workflow that starts with a **Webhook** node:
   - Method: `POST`.
   - Path: e.g. `argus-client-hub`.
   - Respond: "Immediately", or a Respond to Webhook node with status 200.
2. Copy the **Production URL** (not the Test URL) and activate the workflow.
3. Dashboard → **Settings → n8n + Google Sheet**:
   - paste the URL;
   - click **Generate a secret** and copy it into n8n (see section 3);
   - **Save**, then **Send test event** → you should see `test.ping` in n8n.
4. Click **Send pending events** to deliver everything that waited.

You can set `N8N_WEBHOOK_URL` / `N8N_WEBHOOK_SECRET` as env vars instead. Env wins over Settings.

**Retries.** Failed deliveries retry after 1 min, 5 min, 30 min, 2 h, 6 h, 12 h and 24 h (8 attempts in total). They are retried by `/api/cron/outbox` and `/api/cron/daily`, or manually from Settings. To retry often, add an n8n **Schedule** node every 15 min that calls:

```
GET https://<app>/api/cron/outbox
Authorization: Bearer <CRON_SECRET>
```

## 2. Request format

```
POST <webhook>
content-type: application/json
x-argus-event: feedback.created
x-argus-delivery: <event uuid>          # same id on retries → use it to de-duplicate
x-argus-timestamp: 1790000000           # unix seconds
x-argus-signature: sha256=<hex>         # HMAC-SHA256(secret, `${timestamp}.${rawBody}`)
```

```jsonc
{
  "id": "6f3c…",                 // delivery id (unique per event)
  "event": "feedback.created",
  "created_at": "2026-10-02T09:46:12.000Z",
  "source": "argus-client-hub",
  "data": { … },                 // event-specific, see below
  "notify": {                    // from Settings → Notifications
    "whatsapp": "+880 1303-364567",
    "email": "neonemiami@gmail.com",
    "new_feedback": true, "low_rating": true, "daily_reminder": true, "post_status": false,
    "urgent": true               // true when rating ≤ 3
  }
}
```

Any 2xx response counts as delivered. Anything else, or no answer within 8 s, counts as failed and is retried.

## 3. Verify the signature (n8n Code node)

Put this right after the Webhook node. The Webhook node must have **"Raw Body"** turned on (Options → Raw Body).

```js
// n8n Code node · Mode: Run Once for All Items
const crypto = require('crypto');
const SECRET = 'paste-the-secret-from-Settings';
const item = $input.first();
const h = item.json.headers;
// Raw Body ON → the exact bytes are in the binary property "data".
// Fallback: re-serialise the parsed body (the app sends compact JSON, so this usually matches).
let raw;
try { raw = (await this.helpers.getBinaryDataBuffer(0, 'data')).toString('utf8'); }
catch { raw = JSON.stringify(item.json.body); }
const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(`${h['x-argus-timestamp']}.${raw}`).digest('hex');
if (h['x-argus-signature'] !== expected) throw new Error('Bad signature');
if (Math.abs(Date.now() / 1000 - Number(h['x-argus-timestamp'])) > 300) throw new Error('Too old');
return [{ json: JSON.parse(raw) }];
```

If your n8n plan blocks `require('crypto')`, allow it with `NODE_FUNCTION_ALLOW_BUILTIN=crypto`. Or skip the check while testing; the secret is optional.

## 4. Events

| Event | When | Useful `data` fields |
|---|---|---|
| `feedback.created` | A client submits the form | `ref`, `client`, `company`, `services`, `rating`, `communication`, `result`, `did_well`, `do_better`, `recommend`, `public_permission`, `display_name`, `photo_url`, `language`, `follow_up`, `post_status`, `dashboard_url`, **`sheet_row`** |
| `post.status_changed` | Team changes Not for post / Pending / Posted or the post link | `ref`, `post_status`, `post_status_label`, `post_link`, **`sheet_row`** |
| `followup.changed` | Follow-up marked done / reopened | `ref`, `client`, `follow_up` |
| `client.created` | Client added | `client`, `company`, `services`, `status`, `feedback_link` |
| `client.link_sent` | Link sent by WhatsApp / email / copied | `client`, `channel`, `feedback_link` |
| `reminder.due` | Daily 10:00 (Dhaka) for each completed project with no feedback after N days | `client`, `company`, `whatsapp`, `email`, `link_status`, `days_since_completion`, `feedback_link`, `dashboard_url` |
| `test.ping` | "Send test event" button | `message`, `by` |

Each event type can be switched off in Settings. Switched-off events are stored as `skipped`.

## 5. Google Sheet

Create a sheet named **ARGUS · Client Feedback**. Put these **18 headers in row 1, exactly in this order:**

```
Feedback ID | Date | Client | Company | Service | Rating | Communication | Result | Did well | Do better | Recommend | Public permission | Display name | Photo URL | Follow-up | Post status | Post link | Source
```

`data.sheet_row` already has these exact keys, so the n8n **Google Sheets** node can map it directly:

- **On `feedback.created`:** Operation **Append or Update Row**, "Column to match on" = `Feedback ID`, values = `{{$json.data.sheet_row}}` (map each column, or use "Map Automatically").
- **On `post.status_changed`:** the same node and the same match column. It updates the existing row with the new Post status and Post link.

Dashboard → Feedback → **Export CSV** produces the same 18 columns. You can use it to fill the Sheet once with older feedback.

Paste the Sheet link in Settings so the team gets an "Open Google Sheet" button.

## 6. Suggested workflow

```
Webhook (POST, raw body)
  → Code: verify signature
  → Switch on {{$json.event}}
      feedback.created     → Google Sheets: Append or Update (match Feedback ID)
                           → IF {{$json.notify.urgent}}
                                 true  → WhatsApp + Email "⚠️ {{client}} rated {{rating}}★: {{do_better}} · {{dashboard_url}}"
                                 false → WhatsApp + Email "New feedback {{rating}}★ from {{client}}"
      post.status_changed  → Google Sheets: Append or Update (match Feedback ID)
                           → (optional) Email if notify.post_status
      reminder.due         → WhatsApp to team: "Ask {{client}} for feedback: {{feedback_link}}"
      test.ping            → (nothing, or a Slack/WhatsApp "it works")
  → Respond to Webhook 200
```

**WhatsApp options in n8n:**
- the **WhatsApp Business Cloud** node (Meta, needs a verified number and approved templates for business-initiated messages);
- Twilio WhatsApp;
- a provider's HTTP API.

The app only gives n8n the number (`notify.whatsapp`). Sending is n8n's job.

A starter you can import is in [`n8n-starter-workflow.json`](n8n-starter-workflow.json) (n8n → Workflows → Import from file). After importing:
1. set your Google Sheets credential and sheet ID;
2. set your email credential;
3. choose a WhatsApp provider;
4. paste the secret;
5. activate.

Node versions can differ between n8n versions. If a node shows a warning, open it and re-select the operation.
