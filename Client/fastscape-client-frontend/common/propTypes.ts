import { Vehicle } from './interfaces';

export type HeaderPropType = {
  onLoginClick: () => void;
};

export type LoginModelPropType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
};

export type RegisterModelPropType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
};

export type ForgotPasswordPropType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type DatePickerPropType = {
  label?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export type ChipOption<T extends string> = {
  label: string;
  value: T;
};

export type ChipToggleProps<T extends string> = {
  options: ChipOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

export type VehicleCardPropType = {
  vehicle: Vehicle;
  onClick?: () => void;
};
