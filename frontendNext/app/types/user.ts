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

  // Basic information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: DateOfBirth;

  // Address information
  country: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: Coordinates;  // Coordinates for distance calculation
  maxDistance?: number;       // Maximum distance for book lending (kilometers)

  // Profile picture
  avatar?: string;           // Avatar URL from API
  profilePicture?: string;   // Local uploaded base64

  // System information
  createdAt: Date;

  // Social / Statistics
  bio?: string;               // User bio
  preferredLanguages?: string[]; // Preferred languages

}
