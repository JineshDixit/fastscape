'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { DocumentStatus, ValidationResult, RequiredDocument, EligibilityResult } from '@/app/axios/services/document';

export interface DocumentState {
  documentStatus: DocumentStatus | null;
  validationResult: ValidationResult | null;
  requiredDocuments: RequiredDocument[];
  eligibilityResult: EligibilityResult | null;
  isLoading: boolean;
  error: string | null;
}

interface DocumentContextType extends DocumentState {
  setState: React.Dispatch<React.SetStateAction<DocumentState>>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const initialState: DocumentState = {
  documentStatus: null,
  validationResult: null,
  requiredDocuments: [],
  eligibilityResult: null,
  isLoading: false,
  error: null,
};

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DocumentState>(initialState);

  return <DocumentContext.Provider value={{ ...state, setState }}>{children}</DocumentContext.Provider>;
};

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};
