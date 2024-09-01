import React from 'react';
import { useFF7Addresses, FF7Addresses } from './ff7Addresses';
import { useFF7 } from './useFF7';

export const FF7Context = React.createContext<FF7Addresses | null>(null);

export const FF7Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addresses, isLoading, error } = useFF7Addresses();

  if (isLoading) {
    return <div>Loading FF7 addresses...</div>;
  }

  if (error) {
    return <div>Error loading FF7 addresses: {error}</div>;
  }

  if (!addresses) {
    return <div>FF7 addresses not available</div>;
  }

  return <FF7Context.Provider value={addresses}>{children}</FF7Context.Provider>;
};

export const useFF7Context = () => {
  const context = React.useContext(FF7Context);
  if (context === null) {
    throw new Error('useFF7Context must be used within a FF7Provider');
  }
  return context;
};