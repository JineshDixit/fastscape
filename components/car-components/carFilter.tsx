'use client';

import { useVehicle } from "@/app/axios";
import { useEffect } from "react";

const CarFilter = () => {
  const { 
    filterMetadata, 
    fetchFilterMetadata, 
    isLoading, 
    error,
    clearError 
  } = useVehicle();

  useEffect(() => {
    fetchFilterMetadata();
  }, [fetchFilterMetadata]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">Error loading filters: {error}</p>
        <button 
          onClick={() => {
            clearError();
            fetchFilterMetadata();
          }}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!filterMetadata) {
    return (
      <div className="p-4 text-gray-500">
        No filter data available
      </div>
    );
  }

  return (
    <div className="">
      
      {/* Body Types Filter */}
      {filterMetadata.bodyTypes && filterMetadata.bodyTypes.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">By Body Types</h4>
          <div className="space-y-2">
            {filterMetadata.bodyTypes.map((bodyType) => (
              <div key={bodyType.bodyType} className="flex justify-between items-center">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                  />
                  {bodyType.bodyType}
                </label>
                <span className="text-sm text-gray-500">({bodyType.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filterMetadata.brands && filterMetadata.brands.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">By Brands</h4>
          <div className="space-y-2">
            {filterMetadata.brands.map((brand) => (
              <div key={brand.make} className="flex justify-between items-center">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                  />
                  {brand.make}
                </label>
                <span className="text-sm text-gray-500">({brand.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarFilter;