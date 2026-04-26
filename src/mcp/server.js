// src/mcp/server.js
// LifeMap MCP Server — Claude se connect hota hai
// Run: node src/mcp/server.js

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { readFileSync } from 'fs';

// Firebase Admin init
const serviceAccount = JSON.parse(
  readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT, 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Pending actions store (preview ke liye)
const pendingActions = new Map();
let pendingUid = null; // Current user UID — login pe set hoga

// ---- Helper to get user's UID from env or config ----
function getUid() {
  return process.env.LIFEMAP_USER_UID || pendingUid;
}

// ---- Firestore helpers ----
async function getDomains(uid) {
  const snap = await db.collection('users').doc(uid).collection('domains').orderBy('createdAt').get();
  const domains = [];
  for (const d of snap.docs) {
    const dom = { id: d.id, ...d.data(), items: [] };
    const items = await db.collection('users').doc(uid)
      .collection('domains').doc(d.id).collection('items').orderBy('createdAt').get();
    dom.items = items.docs.map(i => ({ id: i.id, ...i.data() }));
    domains.push(dom);
  }
  return domains;
}

// ---- MCP Server ----
const server = new McpServer({
  name: 'lifemap',
  version: '1.0.0',
});

// Tool: list_domains
server.tool('list_domains', 'Get all domains and goals', {}, async () => {
  const uid = getUid();
  if (!uid) return { content: [{ type: 'text', text: 'User not authenticated. Set LIFEMAP_USER_UID env variable.' }] };
  const domains = await getDomains(uid);
  return { content: [{ type: 'text', text: JSON.stringify(domains, null, 2) }] };
});

// Tool: add_goal — PREVIEW mode (confirm karna padega)
server.tool('add_goal',
  'Add a new goal or subtask. Always shows preview first.',
  {
    domainId: z.string().describe('Domain ID'),
    name: z.string().describe('Goal name'),
    status: z.enum(['planned', 'in-progress', 'done', 'overdue']).optional(),
    deadline: z.string().optional().describe('YYYY-MM-DD format'),
    parentId: z.string().optional().describe('Parent goal ID for subtask, null for root'),
    imp: z.boolean().optional().describe('Mark as important'),
    tl: z.boolean().optional().describe('Show on timeline'),
    reminder: z.boolean().optional(),
  },
  async (params) => {
    const uid = getUid();
    if (!uid) return { content: [{ type: 'text', text: 'Not authenticated.' }] };
    const actionId = `act_${Date.now()}`;
    pendingActions.set(actionId, {
      type: 'add_item',
      domId: params.domainId,
      data: {
        name: params.name,
        status: params.status || 'planned',
        deadline: params.deadline || '',
        parentId: params.parentId || null,
        imp: params.imp || false,
        tl: params.tl || false,
        reminder: params.reminder || false,
      }
    });
    return {
      content: [{
        type: 'text',
        text: `PREVIEW — ye add karna chahta hoon:\n\n` +
              `📌 Goal: "${params.name}"\n` +
              `📁 Domain: ${params.domainId}\n` +
              `📊 Status: ${params.status || 'planned'}\n` +
              `📅 Deadline: ${params.deadline || 'none'}\n` +
              `⭐ Important: ${params.imp ? 'yes' : 'no'}\n\n` +
              `Action ID: ${actionId}\n` +
              `Confirm karne ke liye: confirm_action tool use karo with id="${actionId}"\n` +
              `Cancel karne ke liye: cancel_action tool use karo`
      }]
    };
  }
);

// Tool: update_goal — PREVIEW mode
server.tool('update_goal',
  'Update an existing goal. Shows preview first.',
  {
    domainId: z.string(),
    goalId: z.string(),
    name: z.string().optional(),
    status: z.enum(['planned', 'in-progress', 'done', 'overdue']).optional(),
    deadline: z.string().optional(),
    imp: z.boolean().optional(),
    tl: z.boolean().optional(),
    reminder: z.boolean().optional(),
  },
  async (params) => {
    const uid = getUid();
    const actionId = `act_${Date.now()}`;
    const data = {};
    if (params.name !== undefined) data.name = params.name;
    if (params.status !== undefined) data.status = params.status;
    if (params.deadline !== undefined) data.deadline = params.deadline;
    if (params.imp !== undefined) data.imp = params.imp;
    if (params.tl !== undefined) data.tl = params.tl;
    if (params.reminder !== undefined) data.reminder = params.reminder;
    pendingActions.set(actionId, { type: 'update_item', domId: params.domainId, itemId: params.goalId, data });
    return {
      content: [{
        type: 'text',
        text: `PREVIEW — update karna chahta hoon:\n\n` +
              `Goal ID: ${params.goalId}\n` +
              `Changes: ${JSON.stringify(data, null, 2)}\n\n` +
              `Action ID: ${actionId}\n` +
              `confirm_action id="${actionId}" se confirm karo`
      }]
    };
  }
);

// Tool: delete_goal — PREVIEW mode
server.tool('delete_goal',
  'Delete a goal and its subtasks. Shows preview first.',
  { domainId: z.string(), goalId: z.string(), goalName: z.string().describe('Name for confirmation display') },
  async (params) => {
    const actionId = `act_${Date.now()}`;
    pendingActions.set(actionId, { type: 'delete_item', domId: params.domainId, itemId: params.goalId });
    return {
      content: [{
        type: 'text',
        text: `⚠️ PREVIEW — DELETE karna chahta hoon:\n\n` +
              `Goal: "${params.goalName}" aur uske saare subtasks\n\n` +
              `Action ID: ${actionId}\n` +
              `confirm_action id="${actionId}" se confirm karo`
      }]
    };
  }
);

// Tool: confirm_action
server.tool('confirm_action',
  'Confirm a pending action after user approval',
  { actionId: z.string() },
  async ({ actionId }) => {
    const uid = getUid();
    const action = pendingActions.get(actionId);
    if (!action) return { content: [{ type: 'text', text: `Action ${actionId} not found or already executed.` }] };
    pendingActions.delete(actionId);
    // Actually execute
    const ref = db.collection('users').doc(uid).collection('domains').doc(action.domId);
    try {
      if (action.type === 'add_item') {
        await ref.collection('items').add({ ...action.data, createdAt: new Date(), updatedAt: new Date() });
      } else if (action.type === 'update_item') {
        await ref.collection('items').doc(action.itemId).update({ ...action.data, updatedAt: new Date() });
      } else if (action.type === 'delete_item') {
        await ref.collection('items').doc(action.itemId).delete();
      } else if (action.type === 'add_domain') {
        await db.collection('users').doc(uid).collection('domains').add({ ...action.data, createdAt: new Date() });
      }
      return { content: [{ type: 'text', text: `✅ Done! Action ${actionId} executed successfully.` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `❌ Error: ${e.message}` }] };
    }
  }
);

// Tool: cancel_action
server.tool('cancel_action',
  'Cancel a pending action',
  { actionId: z.string() },
  async ({ actionId }) => {
    pendingActions.delete(actionId);
    return { content: [{ type: 'text', text: `Action ${actionId} cancelled.` }] };
  }
);

// Tool: get_timeline
server.tool('get_timeline',
  'Get all timeline items (goals with deadlines and tl=true)',
  {},
  async () => {
    const uid = getUid();
    const domains = await getDomains(uid);
    const items = [];
    domains.forEach(d => {
      d.items.filter(i => i.tl && i.deadline).forEach(i => {
        items.push({ ...i, domain: d.name, color: d.color });
      });
    });
    items.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('LifeMap MCP server running...');
