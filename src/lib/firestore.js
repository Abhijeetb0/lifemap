// src/lib/firestore.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, getDocs, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

const domCol = (uid) => collection(db, 'users', uid, 'domains');
const itemCol = (uid, domId) => collection(db, 'users', uid, 'domains', domId, 'items');
const itemDoc = (uid, domId, itemId) => doc(db, 'users', uid, 'domains', domId, 'items', itemId);

// ---- Domains ----
export async function addDomain(uid, { name, color }) {
  return addDoc(domCol(uid), { name, color, createdAt: serverTimestamp() });
}

export async function deleteDomain(uid, domId) {
  const batch = writeBatch(db);
  const snap = await getDocs(itemCol(uid, domId));
  snap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'users', uid, 'domains', domId));
  return batch.commit();
}

// ---- Items (goals + subtasks) ----
export async function addItem(uid, domId, data) {
  const item = {
    name: data.name || 'Untitled',
    status: data.status || 'planned',
    deadline: data.deadline || '',
    reminder: data.reminder || false,
    imp: data.imp || false,
    tl: data.tl || false,
    parentId: data.parentId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(itemCol(uid, domId), item);
}

export async function updateItem(uid, domId, itemId, data) {
  return updateDoc(itemDoc(uid, domId, itemId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItem(uid, domId, itemId) {
  // Delete children too
  const batch = writeBatch(db);
  const all = await getDocs(itemCol(uid, domId));

  function childIds(pid, docs, ids = []) {
    docs.filter(d => d.data().parentId === pid).forEach(d => {
      ids.push(d.id);
      childIds(d.id, docs, ids);
    });
    return ids;
  }

  [itemId, ...childIds(itemId, all.docs)].forEach(id =>
    batch.delete(itemDoc(uid, domId, id))
  );
  return batch.commit();
}