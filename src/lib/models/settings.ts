import mongoose, { Schema, Model } from 'mongoose';

export const SUPPORTED_COUNTRIES = {
  TH: 'Thailand',
  LA: 'Laos',
  MY: 'Malaysia',
  VN: 'Vietnam',
  CN: 'China'
} as const;

export type CountryCode = keyof typeof SUPPORTED_COUNTRIES;

export interface IPaymentMethod {
  phone: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  customBankName?: string;
}

export type MobileButtonType = 'notifications' | 'support' | 'settings';

interface ISettings {
  wallet: string;
  name: string;
  supportedCountries: CountryCode[];
  paymentMethods: Record<CountryCode, IPaymentMethod>;
  shopOpened: boolean;
  mobileButton: MobileButtonType;
}

const paymentMethodSchema = new Schema<IPaymentMethod>({
  phone: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  bankAccount: {
    type: String,
    required: true,
  },
  bankAccountName: {
    type: String,
    required: true,
  },
  customBankName: {
    type: String,
    required: false,
  }
}, { _id: false });

const settingsSchema = new Schema<ISettings>({
  wallet: {
    type: String,
    required: true,
    unique: true,
  },
  mobileButton: {
    type: String,
    enum: ['notifications', 'support', 'settings'],
    default: 'notifications',
  },
  shopOpened: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
  },
  supportedCountries: [{
    type: String,
    enum: Object.keys(SUPPORTED_COUNTRIES),
    required: true
  }],
  paymentMethods: {
    type: Object,
    of: paymentMethodSchema,
    required: true,
    validate: {
      validator: function(value: Record<string, IPaymentMethod>) {
        return Object.keys(value).every(key => key in SUPPORTED_COUNTRIES);
      },
      message: 'Invalid country code in payment methods'
    }
  }
}, {
  timestamps: true
});

// This is the key change - we create a model getter function
let Settings: Model<ISettings>;

try {
  // Try to get the existing model
  Settings = mongoose.model<ISettings>('Settings');
} catch {
  // Model doesn't exist, create it
  Settings = mongoose.model<ISettings>('Settings', settingsSchema);
}

export { Settings };
