
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormStateContextType {
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
}

const FormStateContext = createContext<FormStateContextType | undefined>(undefined);

export function FormStateProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);

  return (
    <FormStateContext.Provider value={{ isDirty, setIsDirty }}>
      {children}
    </FormStateContext.Provider>
  );
}

export function useFormState() {
  const context = useContext(FormStateContext);
  if (context === undefined) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
}
