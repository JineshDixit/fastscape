import { useTranslation } from 'react-i18next';

/**
 * Hook for localizing vehicle model enums and properties
 */
export const useVehicleLocalization = () => {
  const { t } = useTranslation('vehicles');

  const localizeBodyType = (bodyType: string): string => {
    return t(`bodyTypes.${bodyType}`, bodyType);
  };

  const localizeTransmission = (transmission: string): string => {
    return t(`transmission.${transmission}`, transmission);
  };

  const localizeDrivetrain = (drivetrain: string): string => {
    return t(`drivetrain.${drivetrain}`, drivetrain);
  };

  const localizeFuelType = (fuelType: string): string => {
    return t(`fuelType.${fuelType}`, fuelType);
  };

  const localizeStatus = (status: string): string => {
    return t(`status.${status.toLowerCase()}`, status);
  };

  return {
    localizeBodyType,
    localizeTransmission,
    localizeDrivetrain,
    localizeFuelType,
    localizeStatus,
  };
};

/**
 * Hook for localizing booking model enums and properties
 */
export const useBookingLocalization = () => {
  const { t } = useTranslation('bookings');

  const localizeBookingStatus = (status: string): string => {
    // Convert status to lowercase for translation key
    const key = status.toLowerCase().replace(/_/g, '');
    return t(`status.${key}`, status);
  };

  const localizePaymentStatus = (status: string): string => {
    const key = status.toLowerCase().replace(/_/g, '');
    return t(`paymentStatus.${key}`, status);
  };

  const localizePaymentMethod = (method: string): string => {
    const key = method.toLowerCase();
    return t(`paymentMethod.${key}`, method);
  };

  const localizeBookingType = (type: string): string => {
    const key = type.toLowerCase().replace(/_/g, '');
    return t(`bookingType.${key}`, type);
  };

  return {
    localizeBookingStatus,
    localizePaymentStatus,
    localizePaymentMethod,
    localizeBookingType,
  };
};

/**
 * Hook for localizing chauffeur model enums and properties
 */
export const useChauffeurLocalization = () => {
  const { t } = useTranslation('chauffeurs');

  const localizeStatus = (status: string): string => {
    const key = status.toLowerCase();
    return t(`status.${key}`, status);
  };

  const localizeExperienceLevel = (level: string): string => {
    const key = level.toLowerCase().replace(/_/g, '');
    return t(`experienceLevel.${key}`, level);
  };

  return {
    localizeStatus,
    localizeExperienceLevel,
  };
};

/**
 * Hook for localizing client/user model enums and properties
 */
export const useClientLocalization = () => {
  const { t } = useTranslation('clients');

  const localizeVerificationStatus = (status: string): string => {
    const key = status.toLowerCase();
    return t(`verificationStatus.${key}`, status);
  };

  const localizeStatus = (status: string): string => {
    const key = status.toLowerCase();
    return t(`status.${key}`, status);
  };

  return {
    localizeVerificationStatus,
    localizeStatus,
  };
};

/**
 * Hook for localizing document model enums and properties
 */
export const useDocumentLocalization = () => {
  const { t } = useTranslation('documents');

  const localizeDocumentType = (type: string): string => {
    const key = type.toLowerCase().replace(/_/g, '');
    return t(`types.${key}`, type);
  };

  const localizeVerificationStatus = (status: string): string => {
    const key = status.toLowerCase();
    return t(`verificationStatus.${key}`, status);
  };

  return {
    localizeDocumentType,
    localizeVerificationStatus,
  };
};

/**
 * Hook for localizing finance/payment model enums and properties
 */
export const useFinanceLocalization = () => {
  const { t } = useTranslation('finance');

  const localizePaymentType = (type: string): string => {
    const key = type.toLowerCase().replace(/_/g, '');
    return t(`types.${key}`, type);
  };

  const localizePaymentMethod = (method: string): string => {
    const key = method.toLowerCase().replace(/_/g, '');
    return t(`methods.${key}`, method);
  };

  const localizePaymentStatus = (status: string): string => {
    const key = status.toLowerCase().replace(/_/g, '');
    return t(`status.${key}`, status);
  };

  return {
    localizePaymentType,
    localizePaymentMethod,
    localizePaymentStatus,
  };
};

/**
 * Hook for localizing common status values
 */
export const useCommonLocalization = () => {
  const { t } = useTranslation('common');

  const localizeStatus = (status: string): string => {
    const key = status.toLowerCase();
    return t(`status.${key}`, status);
  };

  const localizeAction = (action: string): string => {
    const key = action.toLowerCase();
    return t(`actions.${key}`, action);
  };

  return {
    localizeStatus,
    localizeAction,
  };
};

/**
 * Utility function to get localized options for select dropdowns
 */
export const getLocalizedOptions = (
  options: string[],
  translationFunction: (value: string) => string
): Array<{ value: string; label: string }> => {
  return options.map((option) => ({
    value: option,
    label: translationFunction(option),
  }));
};

/**
 * Utility function to localize enum values in objects
 */
export const localizeEnumInObject = <T extends Record<string, any>>(
  obj: T,
  field: keyof T,
  localizationFunction: (value: string) => string
): T => {
  if (obj[field]) {
    return {
      ...obj,
      [`${String(field)}Localized`]: localizationFunction(obj[field] as string),
    };
  }
  return obj;
};

/**
 * Utility function to localize multiple enum fields in an object
 */
export const localizeMultipleEnums = <T extends Record<string, any>>(
  obj: T,
  fieldMappings: Record<keyof T, (value: string) => string>
): T => {
  let result = { ...obj };
  
  Object.entries(fieldMappings).forEach(([field, localizationFn]) => {
    if (obj[field]) {
      result = {
        ...result,
        [`${field}Localized`]: (localizationFn as (value: string) => string)(obj[field] as string),
      };
    }
  });
  
  return result;
};
