'use client';

import { FC } from 'react';
import { Vehicle } from '@/common/interfaces';
import { useTranslations } from 'next-intl';

interface VehicleSpecsTableProps {
  vehicle: Vehicle;
}

const VehicleSpecsTable: FC<VehicleSpecsTableProps> = ({ vehicle }) => {
  const t = useTranslations('vehicleDetails.specs');
  const tEnum = useTranslations('vehicleDetails.enums');

  const specs = [
    { label: t('passenger'), value: vehicle.passengerCapacity },
    { label: t('transmission'), value: tEnum(vehicle.transmission.toLowerCase() as any) },
    { label: t('engine'), value: vehicle.engine },
    { label: t('drivetrain'), value: tEnum(vehicle.drivetrain.toLowerCase() as any) },
    { label: t('fuelType'), value: tEnum(vehicle.fuelType.toLowerCase() as any) },
    { label: t('horsepower'), value: `${vehicle.horsepower} hp` },
    { label: t('fuelConsumption'), value: vehicle.fuelConsumption },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 md:p-8">
      <div className="flex flex-col gap-4">
        {specs.map((spec, idx) => (
          <div key={idx} className="flex items-center py-1">
            <span className="flex-1 text-base font-semibold text-gray-800">{spec.label}</span>
            <span className="flex-1 text-base font-medium text-gray-600">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleSpecsTable;
