// types/user.ts

export interface DateOfBirth {
  month: string;
  day: string;
  year: string;
}

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
  dateOfBirth?: DateOfBirth;

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
