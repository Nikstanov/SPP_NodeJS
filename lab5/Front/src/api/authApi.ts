import type { Session } from '@/models/session'
import axios from 'axios'

const ref = 'http://localhost:3000/graphql/auth'

const instance = axios.create({
  baseURL: 'http://localhost:3000/graphql/auth/',
  timeout: 1000,
  withCredentials: true
})

function signIn(email: string, password: string, fingerpring: string) {
  return instance
    .post<any>(ref, {
      query: `mutation{signIn(input: {email: "${email}",password: "${password}", fingerprint:"${fingerpring}"}){userId,nickname,token,expiresIn,refreshToken,refreshTokenExpiresIn}}`
    })
    .then((res) => {
      return res.data.data.signIn
    })
}

function signUp(email: string, password: string, nickname: string, fingerpring: string) {
  return instance
    .post<any>(ref, {
      query: `mutation{signUp(input: {email: "${email}",password: "${password}", fingerprint:"${fingerpring}", nickname:"${nickname}"}){userId,nickname,token,expiresIn,refreshToken,refreshTokenExpiresIn}}`
    })
    .then((res) => {
      return res.data.data.signUp
    })
}

function refresh(refresh_token: string, fingerprint: string) {
  return instance
    .post<any>(ref, {
      query: `mutation{refresh(input: {fingerprint:"${fingerprint}"}){userId,nickname,token,expiresIn,refreshToken,refreshTokenExpiresIn}}`
    })
    .then((res) => {
      return res.data.data.refresh
    })
}

function signOut() {
  return instance.post(ref, {
    query: 'mutation{signOut}'
  })
}

export { signIn, signUp, refresh, signOut }
