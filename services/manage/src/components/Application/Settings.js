export const Settings = ({ app }) => {
  return (
    <div>
      <h1>Settings</h1>
      <h2>Client ID: {app.client_id}</h2>
      <h2>Client Name: {app.client_name}</h2>
    </div>
  )
}
