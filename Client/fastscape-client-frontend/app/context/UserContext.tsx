'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { UserProfile } from '@/common/interfaces';

export interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

interface UserContextType extends UserState {
  setState: React.Dispatch<React.SetStateAction<UserState>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<UserState>(initialState);

  return <UserContext.Provider value={{ ...state, setState }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
