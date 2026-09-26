import { useState, useCallback } from 'react';
import { addressService, type CreateAddressRequest, type UpdateAddressRequest } from '../services/address';
import type { Address } from '../../../common/interfaces';

export interface UseAddressReturn {
    addresses: Address[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchAddresses: () => Promise<void>;
    createAddress: (data: CreateAddressRequest) => Promise<Address | null>;
    updateAddress: (data: UpdateAddressRequest) => Promise<Address | null>;
    deleteAddress: (addressId: string) => Promise<boolean>;
    setDefaultAddress: (addressId: string) => Promise<Address | null>;

    // Computed
    defaultAddress: Address | null;
    hasAddresses: boolean;
}

export const useAddress = (): UseAddressReturn => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAddresses = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await addressService.getAddressesForBooking();

            if (response.success && response.data) {
                setAddresses(response.data.addresses);
            } else {
                setError(response.message || 'Failed to fetch addresses');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching addresses');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createAddress = useCallback(async (data: CreateAddressRequest): Promise<Address | null> => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await addressService.createAddress(data);

            if (response.success && response.data) {
                // Refresh addresses list
                await fetchAddresses();
                return response.data;
            } else {
                setError(response.message || 'Failed to create address');
                return null;
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while creating address');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddresses]);

    const updateAddress = useCallback(async (data: UpdateAddressRequest): Promise<Address | null> => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await addressService.updateAddress(data);

            if (response.success && response.data) {
                // Refresh addresses list
                await fetchAddresses();
                return response.data;
            } else {
                setError(response.message || 'Failed to update address');
                return null;
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while updating address');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddresses]);

    const deleteAddress = useCallback(async (addressId: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await addressService.deleteAddress(addressId);

            if (response.success) {
                // Refresh addresses list
                await fetchAddresses();
                return true;
            } else {
                setError(response.message || 'Failed to delete address');
                return false;
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting address');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddresses]);

    const setDefaultAddress = useCallback(async (addressId: string): Promise<Address | null> => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await addressService.setDefaultAddress(addressId);

            if (response.success && response.data) {
                // Refresh addresses list
                await fetchAddresses();
                return response.data;
            } else {
                setError(response.message || 'Failed to set default address');
                return null;
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while setting default address');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddresses]);

    // Computed values
    const defaultAddress = addresses.find(addr => addr.isDefault) || null;
    const hasAddresses = addresses.length > 0;

    return {
        addresses,
        isLoading,
        error,

        // Actions
        fetchAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,

        // Computed
        defaultAddress,
        hasAddresses,
    };
};