import { useState, useEffect } from 'react';

// Custom simple hook-based reactive state for auth to avoid installing state manager boilerplate
class AuthStore {
  listeners = new Set();
  user = null;
  token = null;

  constructor() {
    this.token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_session');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch {
        this.user = null;
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  getSession() {
    return { user: this.user, token: this.token };
  }

  login(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_session', JSON.stringify(user));
    this.notify();
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_session');
    this.notify();
  }

  changeBranch(branchId) {
    if (this.user) {
      this.user = { ...this.user, branchId };
      localStorage.setItem('user_session', JSON.stringify(this.user));
      this.notify();
    }
  }
}

export const authStore = new AuthStore();

export function useAuth() {
  const [session, setSession] = useState(authStore.getSession());

  useEffect(() => {
    return authStore.subscribe(() => {
      setSession(authStore.getSession());
    });
  }, []);

  return {
    ...session,
    login: (user, token) => authStore.login(user, token),
    logout: () => authStore.logout(),
    changeBranch: (branchId) => authStore.changeBranch(branchId),
    isAuthenticated: !!session.token,
  };
}
