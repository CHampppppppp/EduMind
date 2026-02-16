import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 获取本地存储的用户信息
export function getStoredUser() {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
      return null;
    }
  }
  return null;
}

// 带用户认证的fetch函数
export async function authFetch(url: string, options: RequestInit = {}) {
  const user = getStoredUser();
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  
  if (user && user.id) {
    headers.set("X-User-Id", user.id);
  }
  
  return fetch(url, {
    ...options,
    headers
  });
}

