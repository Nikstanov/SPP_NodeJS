export class Session {
  userId: string
  nickname: string
  token: string
  expiresIn: number
  refreshToken: string
  refreshTokenExpiresIn: number

  constructor(
    userId: string,
    nickname: string,
    token: string,
    expiresIn: number,
    refreshToken: string,
    refreshTokenExpiresIn: number
  ) {
    this.userId = userId
    this.nickname = nickname
    this.token = token
    this.expiresIn = expiresIn
    this.refreshToken = refreshToken
    this.refreshTokenExpiresIn = refreshTokenExpiresIn
  }
}
