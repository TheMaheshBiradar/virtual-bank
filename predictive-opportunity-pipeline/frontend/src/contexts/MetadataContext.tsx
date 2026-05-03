import React, { createContext, useContext, useState, useEffect } from 'react';
import { OpportunityType, TypeMetadata, Stage, User } from '../constants';

interface MetadataContextType {
  types: Record<OpportunityType, TypeMetadata>;
  stages: Stage[];
  users: User[];
  isLoading: boolean;
  error: string | null;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export const MetadataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Omit<MetadataContextType, 'isLoading' | 'error'>>({
    types: {} as any,
    stages: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch('/api/metadata/schema');
        if (!res.ok) throw new Error('Failed to fetch metadata');
        const json = await res.json();
        setData({
          types: json.types || {},
          stages: json.stages || [],
          users: json.users || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  return (
    <MetadataContext.Provider value={{ ...data, isLoading, error }}>
      {children}
    </MetadataContext.Provider>
  );
};

export const useMetadata = () => {
  const context = useContext(MetadataContext);
  if (context === undefined) {
    throw new Error('useMetadata must be used within a MetadataProvider');
  }
  return context;
};
