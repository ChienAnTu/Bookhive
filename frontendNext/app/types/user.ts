// types/user.ts
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface User {
  id: string;

  // basic info
  firstName: string;
  lastName: string;
  name: string;              // Delivery contact name
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string | null
  // address
  country: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: Coordinates;  // GPS
  maxDistance?: number;       // max lend distance（km）

  // profile pic
  avatar?: string;           // default
  profilePicture?: string;   // user upload

 // Stripe Connect account id（任选其一或同时存在，后端用哪个就留哪个）
  connectAccountId?: string | null;
  acc_id?: string | null;

  // sys
  createdAt: Date;

  // social data
  bio?: string;
  preferredLanguages?: string[];
}

// rating
export interface UserWithRating extends User {
  rating: number;
}
