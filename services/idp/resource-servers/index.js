import { rsInfo } from './management.js'

const usersResourceServers = [] // make table and fill dynamically from management api

export async function getResourceServers() {
  return [...usersResourceServers, rsInfo]
}
