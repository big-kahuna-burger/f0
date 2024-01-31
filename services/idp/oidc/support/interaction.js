import prisma from '../../db/client.js'

export default {
  clearInteractionError
}

async function clearInteractionError(uid) {
  const interaction = await prisma.oidcModel.findFirst({ where: { id: uid } })
  if (!interaction) {
    return
  }
  const nextPayload = interaction.payload
  if (!nextPayload.lastSubmission) {
    return
  }
  const lastSubmission = { ...nextPayload.lastSubmission }
  lastSubmission.user_error_desc = undefined
  lastSubmission.user_error = undefined
  lastSubmission.lastAction = undefined
  nextPayload.lastSubmission = lastSubmission

  await prisma.oidcModel.update({
    where: { id: uid },
    data: { payload: nextPayload }
  })
}
