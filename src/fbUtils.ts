import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Bill, Person, LineConfig, PromptPayConfig, BearTransaction, LineNotificationLog } from './types';
import { INITIAL_BILLS, INITIAL_PEOPLE, INITIAL_LINE_CONFIG, INITIAL_PROMPTPAY } from './utils/storage';

export const fb = {
  subscribeBills: (callback: (bills: Bill[]) => void) => {
    return onSnapshot(collection(db, 'bills'), (snapshot) => {
      const bills: Bill[] = [];
      snapshot.forEach((doc) => bills.push(doc.data() as Bill));
      callback(bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.error("Error fetching bills:", error);
    });
  },
  
  saveBill: async (bill: Bill) => {
    await setDoc(doc(db, 'bills', bill.id), bill);
  },
  
  deleteBill: async (id: string) => {
    await deleteDoc(doc(db, 'bills', id));
  },

  subscribePeople: (callback: (people: Person[]) => void) => {
    return onSnapshot(collection(db, 'people'), (snapshot) => {
      const people: Person[] = [];
      snapshot.forEach((doc) => people.push(doc.data() as Person));
      if (people.length === 0) {
        callback(INITIAL_PEOPLE);
      } else {
        callback(people);
      }
    });
  },
  
  savePerson: async (person: Person) => {
    await setDoc(doc(db, 'people', person.id), person);
  },

  deletePerson: async (id: string) => {
    await deleteDoc(doc(db, 'people', id));
  },

  subscribeBearTransactions: (callback: (txs: BearTransaction[]) => void) => {
    return onSnapshot(collection(db, 'bearTransactions'), (snapshot) => {
      const txs: BearTransaction[] = [];
      snapshot.forEach((doc) => txs.push(doc.data() as BearTransaction));
      callback(txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
  },

  saveBearTransaction: async (tx: BearTransaction) => {
    await setDoc(doc(db, 'bearTransactions', tx.id), tx);
  },

  deleteBearTransaction: async (id: string) => {
    await deleteDoc(doc(db, 'bearTransactions', id));
  },

  subscribeConfig: (callback: (config: { line: LineConfig, promptPay: PromptPayConfig }) => void) => {
    return onSnapshot(doc(db, 'appConfig', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          line: data.lineConfig || INITIAL_LINE_CONFIG,
          promptPay: data.promptPayConfig || INITIAL_PROMPTPAY,
        });
      } else {
        callback({ line: INITIAL_LINE_CONFIG, promptPay: INITIAL_PROMPTPAY });
      }
    });
  },

  saveLineConfig: async (config: LineConfig) => {
    await setDoc(doc(db, 'appConfig', 'global'), { lineConfig: config }, { merge: true });
  },

  savePromptPayConfig: async (config: PromptPayConfig) => {
    await setDoc(doc(db, 'appConfig', 'global'), { promptPayConfig: config }, { merge: true });
  }
};
