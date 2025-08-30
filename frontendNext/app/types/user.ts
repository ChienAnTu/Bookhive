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

  // 基本信息
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: DateOfBirth;

  // 地址信息
  country: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: Coordinates;  // 经纬度，方便计算距离
  maxDistance?: number;       // 借书的最大距离（公里）

  // 头像
  avatar?: string;           // 从 API 获取的头像 URL
  profilePicture?: string;   // 本地上传的 base64

  // 系统信息
  createdAt: Date;

  // 社交 / 数据统计
  bio?: string;               // 用户简介
  preferredLanguages?: string[]; // 偏好语言

}
