import { useLoaderData } from 'react-router-dom'
export function Connections() {
  const { connections } = useLoaderData()
  console.log({ connections })
  return <></>
}
