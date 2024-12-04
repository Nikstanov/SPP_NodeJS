import type { Session } from '@/models/session'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const ref = 'http://localhost:3000/auth/'

const instance = axios.create({
  baseURL: 'http://localhost:3000/auth/',
  timeout: 1000,
  withCredentials: true
})

function signIn(email: string, password: string, fingerpring: string) {
  return instance
    .post<Session>(ref + 'sign_in', {
      email: email,
      password: password,
      fingerprint: fingerpring
    })
    .then((res) => {
      return res.data
    })
}

function signUp(email: string, password: string, nickname: string, fingerpring: string) {
  return instance
    .post<Session>(ref + 'sign_up', {
      email: email,
      password: password,
      nickname: nickname,
      fingerprint: fingerpring
    })
    .then((res) => {
      return res.data
    })
}

function refresh(refresh_token: string, fingerprint: string) {
  return instance
    .post<Session>(ref + 'refresh', {
      fingerprint: fingerprint
    })
    .then((res) => {
      return res.data
    })
}

function signOut() {
  return instance.post(ref + 'sign_out')
}

export { signIn, signUp, refresh, signOut }
