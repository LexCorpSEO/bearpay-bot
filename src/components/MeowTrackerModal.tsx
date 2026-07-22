import React from 'react';
import { BearTrackerModal } from './BearTrackerModal';
import { BearTransaction, Person } from '../types';

interface MeowTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  people?: Person[];
  transactions?: BearTransaction[];
  onAddTransaction: (transaction: Omit<BearTransaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const MeowTrackerModal: React.FC<MeowTrackerModalProps> = (props) => {
  return <BearTrackerModal {...props} />;
};

export { BearTrackerModal };
