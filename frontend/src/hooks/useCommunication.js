
import { useContext } from 'react';
import { CommunicationContext } from '../context/CommunicationContext';

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  
  return context;
};