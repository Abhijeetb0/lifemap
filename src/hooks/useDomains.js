// src/hooks/useDomains.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addDomain, addItem, updateItem, deleteItem, deleteDomain } from '../lib/firestore';

export function useDomains(uid) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const domRef = collection(db, 'users', uid, 'domains');
    const unsubs = [];

    const unsubDom = onSnapshot(domRef, (snap) => {
      if (snap.empty) {
        setDomains([]);
        setLoading(false);
        return;
      }

      // Ek shared object domains ke liye
      const domMap = {};
      snap.docs.forEach(d => {
        domMap[d.id] = { id: d.id, ...d.data(), items: domMap[d.id]?.items || [] };
      });

      // Har domain ke items real-time listen karo
      snap.docs.forEach(d => {
        const itemRef = collection(db, 'users', uid, 'domains', d.id, 'items');
        const unsub = onSnapshot(itemRef, (iSnap) => {
          domMap[d.id].items = iSnap.docs.map(i => ({ id: i.id, ...i.data() }));
          // Order maintain karo
          const ordered = snap.docs
            .filter(dd => domMap[dd.id])
            .map(dd => domMap[dd.id]);
          setDomains([...ordered]);
          setLoading(false);
        }, (err) => {
          console.error('Items error:', err);
          setLoading(false);
        });
        unsubs.push(unsub);
      });
    }, (err) => {
      console.error('Domains error:', err);
      setLoading(false);
    });

    return () => {
      unsubDom();
      unsubs.forEach(u => u());
    };
  }, [uid]);

  return {
    domains,
    loading,
    addDomain: (data) => addDomain(uid, data),
    addItem: (domId, data) => addItem(uid, domId, data),
    updateItem: (domId, itemId, data) => updateItem(uid, domId, itemId, data),
    deleteItem: (domId, itemId) => deleteItem(uid, domId, itemId),
    deleteDomain: (domId) => deleteDomain(uid, domId),
  };
}