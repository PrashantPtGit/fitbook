export const updateMemberValidity = async (device, employeeNo, startDate, endDate, enable = true) => {
  const auth = btoa(device.username + ':' + device.password)
  const url = 'http://' + device.device_ip + ':' + (device.device_port || 80) + '/ISAPI/AccessControl/UserInfo/Modify?format=json'

  const body = {
    UserInfo: {
      employeeNo: String(employeeNo),
      Valid: {
        enable: enable,
        startTime: startDate + ' 00:00:00',
        endTime: endDate + ' 23:59:59',
      },
    },
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + auth,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    return response.ok
  } catch {
    return false
  }
}

export const disableMember = async (device, employeeNo) => {
  return updateMemberValidity(device, employeeNo, '2000-01-01', '2000-01-02', false)
}

export const enableMember = async (device, employeeNo, endDate) => {
  const startDate = new Date().toISOString().split('T')[0]
  return updateMemberValidity(device, employeeNo, startDate, endDate, true)
}
